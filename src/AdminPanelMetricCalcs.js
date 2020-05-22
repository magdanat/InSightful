import React, { Component } from 'react';
import './css/AdminPanelMetricCalcs.css';
import './index.js';

import { AdminPanelNav } from './AdminPanel'
import firebase from 'firebase/app';

// Not sure if AdminPanelNav is redundant. It is in the Admin panel js file
export class AdminPanelMetricCalcs extends Component {
    constructor(props) {
        super(props);

        this.openModal = this.openModal.bind(this)
        this.openArchiveModal = this.openArchiveModal.bind(this)
        this.openAddModal = this.openAddModal.bind(this)

        this.state = {
            current: "",
            modalDisplay: "none",
            addModalDisplay: "none",
            archivedModalDisplay: "none",
            currentMetricAreaCalculations: new Map(),
            currentArchivedAreaCalculations: new Map()
        }
    }

    componentDidUpdate() {
        console.log(this.state)
    }

    metricAreaItemsList() {
        const metricAreaElements = Array.from(this.props.metrics.entries()).map((key) => {
            return <MetricAreaItem
                metricValue={key[1].metricName}
                metricID={key[1].metricID}
                metricFunc={this.updateChange}
            />
        })
        return metricAreaElements
    }

    updateME(event) {
        let area = event.target.value
        this.setState((state) => {
            state.current = area
            return state
        })
        this.retrieveMetricAreaCalculations()
    }

    handleChange = (event) => {
        let field = event.target.name
        let value = event.target.value

        let changes = {}

        changes[field] = value
        this.setState(changes)
    }

    addCalculation(e) {
        e.preventDefault()
        if (this.checkAddCalculation()) {
            let ref = firebase.database().ref('metricCalculations')
            let id = ref.push().getKey()
            firebase.database().ref('metricCalculations/' + id.toString()).update({
                calcName: this.state.addCalcName,
                calcMetric: this.state.addCalcName,
                calcID: id,
                calcArchived: false,
                metricAreaID: this.state.current,
                dataType: this.state.dataType
            })
        }
    }

    checkAddOpenModal() {
        if (this.state.current) {
            return true
        }
        return false
    }

    checkAddCalculation() {
        if (this.state.addCalcName && this.state.dataType && this.state.current) {
            return true
        }
        return false
    }

    // Retrieves relevant metric calculations for a metric
    // area from the firebase database that are not archived. 
    retrieveMetricAreaCalculations() {
        let rootPath = firebase.database().ref('metricCalculations')
        rootPath.once('value', (snapshot) => {
            let metricCalcInfo = snapshot.val();
            let databaseKeys = Object.keys(metricCalcInfo);
            let mapCalculations = new Map()
            let archivedMap = new Map()

            databaseKeys.map((key) => {
                console.log(metricCalcInfo[key])
                let id = metricCalcInfo[key].metricAreaID
                if (id === this.state.current) {
                    if (!metricCalcInfo[key].calcArchived) {
                        mapCalculations.set(key, metricCalcInfo[key])
                    } else {
                        archivedMap.set(key, metricCalcInfo[key])
                    }
                }
            })
            this.setCalculations(mapCalculations, archivedMap)
        })
    }
    // Sets state to have current metric area calculations for
    // the selected metric area. 
    setCalculations(mapCalculations, archivedMap) {
        this.setState((state) => {
            state.currentMetricAreaCalculations = mapCalculations
            state.currentArchivedAreaCalculations = archivedMap
            return state
        })
    }

    // Represents metric area calculation elements to render after
    // a metric area is chosen. 
    metricAreaCalculations() {
        const metricCalcElements = Array.from(this.state.currentMetricAreaCalculations.
            entries()).map((key) => {
                let calculation = key[1]
                console.log(calculation.calcID)
                return <MetricAreaCalcButton
                    metricCalcName={calculation.calcName}
                    metricCalcID={calculation.calcID}
                    metricCalcFunc={this.openModal}
                />
            })
        return metricCalcElements
    }

    archivedAreaCalculations() {
        const archivedCalcElements = Array.from(this.state.currentArchivedAreaCalculations.
            entries()).map((key) => {
                let calculation = key[1]
                return <MetricAreaCalcButton
                    metricCalcName={calculation.calcName}
                    metricCalcID={calculation.calcID}
                    metricCalcFunc={this.openArchiveModal}
                />
            })
        return archivedCalcElements
    }

    openModal(calcID) {
        this.setState((state) => {
            this.state.currentCalc = calcID
            this.state.modalDisplay = "block"
            return state
        })
    }

    openArchiveModal(calcID) {
        this.setState((state) => {
            this.state.currentArchivedCalc = calcID
            this.state.archivedModalDisplay = "block"
            return state
        })
    }

    openAddModal() {
        if (this.checkAddOpenModal()) {
            this.setState((state) => {
                state.addModalDisplay = "block"
                return state
            })
        }
    }

    closeModal(e) {
        e.preventDefault()
        this.setState((state) => {
            this.state.modalDisplay = "none"
            return state
        })
    }

    closeArchiveModal(e) {
        e.preventDefault()
        this.setState((state) => {
            this.state.archivedModalDisplay = "none"
            return state
        })
    }

    closeAddModal(e) {
        e.preventDefault()
        this.setState((state) => {
            state.addModalDisplay = "none"
            return state
        })
    }

    submitEditInfo(e) {
        e.preventDefault()
        console.log(this.state)
        let rootPath = firebase.database().ref('metricCalculations/' + this.state.currentCalc)
        rootPath.update({
            calcName: this.state.editCalcName
        })
    }

    addForm() {
        let form = (
            <div className="modalForm"
                style={{ display: this.state.addModalDisplay }}>
                <div>
                    <form className="modalBox">
                        <button className="close-button"
                            onClick={(e) => this.closeAddModal(e)}>
                            X
                            </button>
                        <h2>New Metric Name</h2>
                        <div>
                            <label>
                                <input
                                    type="text"
                                    name="addCalcName"
                                    onChange={(e) => this.handleChange(e)}
                                />
                            </label>
                        </div>
                        <h2>
                            Data-Type
                            </h2>
                        <select
                            name="dataType" className="dataType"
                            onChange={(e) => this.handleChange(e)}>
                                <option value="none" disabled selected>Select a data type</option>
                            <option value="number">Number</option>
                            <option value="percent">Percent</option>
                            <option value="money">Money</option>
                            <option value="text">Text</option>
                        </select>
                        <div>
                            <button className="submit"
                                onClick={(e) => this.addCalculation(e)}>
                                Submit
                                </button>
                        </div>
                    </form>
                </div>
            </div>
        )
        return form
    }

    archivedForm() {
        let form = (
            <div className="modalForm"
                style={{ display: this.state.archivedModalDisplay }}>
                <div>
                    <form className="modalBox">
                        <button className="close-button"
                            onClick={(e) => this.closeArchiveModal(e)}>
                            X
                            </button>
                        <h2> Current Metric</h2>
                        <div>
                            <button className="unarchive"
                                onClick={(e) => this.unarchiveMetricCalc(e)}>
                                Unarchive
                                </button>
                        </div>
                    </form>
                </div>
            </div>
        )
        return form
    }

    editForm() {
        let form = (
            <div className="modalForm"
                style={{ display: this.state.modalDisplay }}>
                <div>
                    <form className="modalBox">
                        <button className="close-button"
                            onClick={(e) => this.closeModal(e)}>
                            X
                        </button>

                        <h2>Current Metric</h2>
                        <div>
                            <label>
                                <input
                                    type="text"
                                    name="editCalcName"
                                    onChange={(e) => this.handleChange(e)}
                                />
                            </label>
                        </div>
                        <button className="submit"
                            onClick={(e) => this.submitEditInfo(e)}>
                            Submit
                        </button>
                        <button class="archive"
                            onClick={(e) => this.archiveMetricCalc(e)}>
                            Archive
                        </button>
                    </form>
                </div>
            </div>
        )
        return form
    }

    archiveMetricCalc(e) {
        e.preventDefault()
        if (this.state.currentCalc) {
            let rootPath = firebase.database().ref('metricCalculations/' + this.state.currentCalc)
            rootPath.update({
                calcArchived: true
            })
        }
    }

    unarchiveMetricCalc(e) {
        e.preventDefault()
        let rootPath = firebase.database().ref('metricCalculations/' + this.state.currentArchivedCalc)
        rootPath.update({
            calcArchived: false
        })
    }

    render() {
        const metricAreaItemsList = this.metricAreaItemsList()
        const metricAreaCalculationElements = this.metricAreaCalculations()
        const archivedAreaCalculationElements = this.archivedAreaCalculations()

        let editForm = this.editForm()
        let archiveForm = this.archivedForm()
        let addForm = this.addForm()

        return (
            <div className="body">
                <AdminPanelNav />
                <main>
                <h1 class="ASettingsTitle"> Metrics</h1>
                    <div class="main-content">
                        <div>
                            <h2 className= "selection" id="met-areas">Select a Metric Area</h2>

                            <select id="select-dropdown"
                                onChange={(e) => this.updateME(e)}>
                                <option value="None">None</option>
                                {metricAreaItemsList}
                            </select>
                            <div className="titleButton">
                                <h2 className="subTitle"style={{ display: "inline-block" }}>Metrics</h2>
                                <button className="plus"
                                    onClick={(e) => this.openAddModal(e)}
                                > + </button>
                            </div>
                            <div id="metricAreaCalcElements">
                                {metricAreaCalculationElements}
                            </div>
                            <h2 className= "selection" id="met-areas" >Archived Metrics</h2>
                            <div id="archivedAreaElements">
                                {archivedAreaCalculationElements}
                            {/* <h2 className="metricC">Metric Calculations</h2>
                            <div id="calcForm">
                                <form>
                                    <label for="fname">Enter a Calculation Name </label>
                                    <textarea
                                        onChange={(e) => this.handleChange(e)}
                                        type="text" id="form" name="calcName" />
                                </form>
                                <button className="save2" onClick={() => this.addCalculation()}>Add Calculation</button> */}
                            </div>
                        </div>
                        {editForm}
                        {archiveForm}
                        {addForm}
                    </div>
                </main>
            </div>
        )
    }
}

class MetricAreaItem extends Component {
    render() {
        return (
            <option value={this.props.metricID}>
                {this.props.metricValue}
            </option>
        )
    }
}

// Represesnts a single metric area calculation to render. Will render
// depending on the metric area that was selected.
class MetricAreaCalcButton extends Component {
    componentDidMount() {
        console.log(this.props)
    }

    render() {
        let typeString = this.props.metricCalcID
        return (
            <button
                onClick={(e) => this.props.metricCalcFunc(this.props.metricCalcID)}
                class='selection' type={typeString} value={this.props.metricCalcID}>{this.props.metricCalcName}</button>
        )
    }
}