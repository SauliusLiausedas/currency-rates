import React, { Component } from 'react'
import XMLParser from "react-xml-parser";
import '../stylesheets/mainpage.css'


class MainPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            names: '',
            shortNames: '',
            selectedType: 'EU',
            selectedCurrency: '',
            periodStart: '',
            periodEnd: '',
            today: '',
            currencyData: '',
            error: false,
            changeOverPeriod: '',
            loadingCurrencyContent: false
        }
    }


    componentWillMount() {
        this.getCurrencyNames(this)
        let date = new Date()
        let isoDate = date.toISOString().split('T')[0]
        this.setState({today: isoDate})
    }

    async getCurrencyNames(context) {
        const xhttp = await new XMLHttpRequest()
        const currencyNames = []
        const currencyShortNames = []
        xhttp.open("GET", 'https://cors-anywhere.herokuapp.com/http://old.lb.lt/webservices/fxrates/FxRates.asmx/getCurrencyList?', true)
        xhttp.send()
        xhttp.onreadystatechange = async function () {
            if (this.readyState === 4 && this.status === 200) {
                let xml = await new XMLParser().parseFromString(this.response)
                let docs = xml.children
                for (let doc in docs) {
                    currencyNames.push(docs[doc].children[1].value)
                    currencyShortNames.push(docs[doc].children[0].value)

                }
                context.setState({names: currencyNames, shortNames: currencyShortNames})
            }
        }
    }

    setType(e) {
        this.setState({selectedType: e.target.value})
    }

    setCurrency(e) {
        this.setState({selectedCurrency: e.target.value})
    }

    setPeriod(e) {
        if(e.target.id === 'start') {
            this.setState({periodStart: e.target.value})
        } else if (e.target.id === 'end') {
            this.setState({periodEnd: e.target.value})
        }
    }

    getDates() {
        return (
            <div className={'dateSelect'}>
                <div>
                    <label>Periodo pradžia</label>
                    {this.state.selectedType === 'EU' ?
                        <input id={'start'} min={'2014-09-30'} max={this.state.today} onChange={(e) => this.setPeriod(e)} type={'date'}/> :
                        <input id={'start'} min={'1993-06-25'} max={this.state.today} onChange={(e) => this.setPeriod(e)} type={'date'}/>}
                        <br/>
                    <label>Periodo pabaiga</label>
                    {this.state.selectedType === 'EU' ?
                        <input id={'end'} min={'2014-09-30'} max={this.state.today} onChange={(e) => this.setPeriod(e)} type={'date'}/> :
                        <input id={'end'} min={'1993-06-25'} max={this.state.today} onChange={(e) => this.setPeriod(e)} type={'date'}/> }
                </div>
            </div>
        )
    }

    async getDataFromApi(context) {
        context.setState({loadingCurrencyContent: true})
        const xhttp = await new XMLHttpRequest()
        xhttp.open("GET", `https://cors-anywhere.herokuapp.com/http://old.lb.lt/webservices/fxrates/FxRates.asmx/getFxRatesForCurrency?tp=${context.state.selectedType}&ccy=${context.state.selectedCurrency}&dtFrom=${context.state.periodStart}&dtTo=${context.state.periodEnd}`, true)
        xhttp.send()
        xhttp.onreadystatechange = async function () {
            if (this.readyState === 4 && this.status === 200) {
                let xml = await new XMLParser().parseFromString(this.response)
                let docs = xml.children
                if(docs[0].name === 'OprlErr') {
                    context.setState({error: true, loadingCurrencyContent: false})
                } else {
                    context.setState({currencyData: docs, error: false, loadingCurrencyContent: false})
                }
            }
        }
    }

    showResult() {
        if(this.state.loadingCurrencyContent) {
            return 'Loading...'
        } else {
            if (this.state.currencyData && !this.state.error) {
                let last = this.state.currencyData.length - 1
                let change = (this.state.currencyData[0].children[3].children[1].value - this.state.currencyData[last].children[3].children[1].value).toFixed(4)
                const currencyDates = []
                const currencyValues = []
                this.state.currencyData.map(el => {
                    currencyDates.push(el.children[1].value)
                    currencyValues.push(el.children[3].children[1].value)
                })
                return (
                    <div>
                        <ul>
                            {currencyDates.map((date, i) => {
                                return (
                                    <li key={i}>Data: {date} Kursas: {currencyValues[i]}</li>
                                )
                            })}
                        </ul>
                        <p>Pokytis per periodą: {change}</p>
                    </div>
                )
            } else if (this.state.error) {
                return (
                    <div>
                        Nepavyko rasti duomenų pagal šiuos kriterijus
                    </div>
                )
            } else {
                return ''
            }
        }
    }

    render() {
        return (
            <div>
                <h1> Valiutų kursai </h1>
                <div>
                    <label> Pasirinkite kurso tipą</label>
                    <select onChange={(e) => this.setType(e)}>
                        <option>EU</option>
                        <option>LT</option>
                    </select>
                </div>
                <div className={'currencySelect'}>
                    <label>Pasirinkite valiutą:</label><br/>
                    <select onChange={(e) => this.setCurrency(e)}>
                        {this.state.names.length > 0 ? this.state.names.map((currency, i)=> {
                            return <option value={this.state.shortNames[i]} key={i}>{currency +' ('+ this.state.shortNames[i]+')'}</option>
                        }) : <option disabled> Loading </option>}
                    </select>
                </div>
                    {this.getDates()}
                <button onClick={() => this.getDataFromApi(this)}> Ieškoti </button>
                <div>
                    {this.showResult()}
                </div>
            </div>
        )
    }
}

export default MainPage