import React, { Component } from 'react';
import './css/DataEntry.css';
import './index.js';

import { CardDeck } from 'reactstrap';
import firebase from 'firebase/app';
import { createPortal } from 'react-dom';

export class DataEntry extends Component {
    constructor(props) {
        super(props);

        this.setMetric = this.setMetric.bind(this)
        this.updateChange = this.updateChange.bind(this)
        this.updateSelectForm = this.updateSelectForm.bind(this)
        this.updateRadioForm = this.updateRadioForm.bind(this)
        this.previewForm = this.previewForm.bind(this)
        this.editForm = this.editForm.bind(this)
        this.submitForm = this.submitForm.bind(this)
        this.updateSelectedMetricAreaCalculation = this.updateSelectedMetricAreaCalculation.bind(this)
        this.check = this.check.bind(this)
        this.timeDisplay = this.timeDisplay.bind(this)
        this.dataDisplay = this.dataDisplay.bind(this)

        this.state = {
            currentMetricAreaCalculations: new Map(), // Represents all calculations
            currentArchivedCalculations: new Map(),
            selectedMetricAreaCalculations: null, // Represents the chosen metric area calculation to populate
            metricAreaID: null, // Holds metric area ID
            metricAreaName: null, // Holds metric area name
            canEditActuals: false, // Determines users ability to enter data for actuals
            canEditTargets: false, // Determines users ability to enter data for targets
            currentYear: new Date(), // Used for entering data for the current year
            tfValue: 1, // Will always default to January
            selectTF: "metricGoalsMonths", // Will always default to Months
            // dataType: "number", // Will always default to number
            actualEn: false,
            targetEn: false,
            preview: false,
            month: "",
            lowlight: "", // Needed for firebase interaction
            highlight: "", // Needed for firebase interaction
            mitigation: "", // Needed for firebase interaction
            metrics: new Map()
        }
    }

    componentDidMount() {
        this.checkCurrentDateActuals()
        this.checkCurrentDateTargets()
    }

    componentDidUpdate() {
        console.log(this.state)
    }

    // Checks the current date of the month. If it is the first 3 months of the year
    // the user can enter target data for the year.
    // Note: To allow admin panel compatability to enable users to alter
    // targets/actuals, check the following conditions:
    // 1. If admin enables ability to alter targets/actuals
    //      allow users to edit/submit information pass.
    // Note: Check firebase to see if it is enabled.
    // 2. For actuals:
    //      a. Check if within first two weeks of the month.
    // 3. For targets:
    //      b. Check if within first two months of the year. 
    checkCurrentDateActuals() {
        let currentDate = new Date()
        let currentDay = currentDate.getDate()

        let checkActuals = this.checkActualEnabled()

        // Check firebase to see if editing actuals is enabled
        // Allow user to submit entry for actuals if 
        if (checkActuals || (currentDay <= 14)) {
            this.enableActuals()
            // Display error messaging
        } else {
            console.log("Current date is within latter half of the month!")
            console.log("Data cannot be submitted without admin permissions")
        }
    }

    // Compares current data to determine is user should be allowed to
    // submit/edit data for targets. 
    checkCurrentDateTargets() {
        let currentDate = new Date()
        let currentMonth = currentDate.getMonth()

        let checkTargets = this.checkTargetEnabled()

        // Check firebase to see if editing targets is enabled
        // Perhaps allow ability to change which months users can change data from admin panel...
        if (checkTargets || currentMonth <= 3) {
            this.enableTargets()
        } else {
            console.log("Current month is nothing the timeframe to enter targets")
            console.log("Data cannot be submitted without admin persmissions")
        }
    }

    // Checks to see if actual editing is enabled
    checkActualEnabled() {
        firebase.database().ref('dataEntrySettings/actualEnabled').once('value', (snapshot) => {
            let info = snapshot.val()
            return info
        })
    }

    // Checks to see if target editing is enabled
    checkTargetEnabled() {
        firebase.database().ref('dataEntrySettings/targetEnabled').once('value', (snapshot) => {
            let info = snapshot.val()
            return info
        })
    }

    // Allows user to submit data entry for actuals.
    enableActuals() {
        this.setState((state) => {
            state.canEditActuals = true
            return state
        })
    }

    // Allows user to submit data entry for targets.
    enableTargets() {
        this.setState((state) => {
            state.canEditTargets = true
            return state
        })
    }

    // Sets current state of metric area ID to button that was clicked
    setMetric(name, id) {
        console.log(name)
        console.log(id)
        this.setState((state) => {
            state.metricAreaID = id
            state.metricAreaName = name
            return state
        })
        this.retrieveMetricAreaCalculations()
    }

    // Sets state to have current metric area calculations for
    // the selected metric area. 
    setCalculations(mapCalculations) {
        this.setState((state) => {
            state.currentMetricAreaCalculations = mapCalculations
            return state
        })
    }

    // Retrieves relevant metric calculations for a metric
    // area from the firebase database. 
    retrieveMetricAreaCalculations() {
        let rootPath = firebase.database().ref('metricCalculations')
        rootPath.once('value', (snapshot) => {
            let metricCalcInfo = snapshot.val();
            let databaseKeys = Object.keys(metricCalcInfo);
            let mapCalculations = new Map()

            databaseKeys.map((key) => {
                let id = metricCalcInfo[key].metricAreaID
                if (id === this.state.metricAreaID) {
                    if (!metricCalcInfo[key].calcArchived) {
                        mapCalculations.set(key, metricCalcInfo[key])
                    }
                }
            })
            this.setCalculations(mapCalculations)
        })
    }

    updateSelectedMetricAreaCalculation(calc, name, type) {
        console.log(type)
        this.setState((state) => {
            state.selectedMetricAreaCalculations = calc
            state.selectedMetricAreaCalculationName = name
            state.selectedMetricAreaCalculationDataType = type
            return state
        })
    }

    // Updates state for month value when a drop-down option is selected
    updateSelectForm(event) {
        let tfValue = (event.target.value)
        this.setState((state) => {
            state.tfValue = tfValue
            return state
        })
    }

    // Updates state for entry value when a radio is selected
    updateRadioForm(event) {
        let atVal = (event.target.value)
        this.setState((state) => {
            state.radio = atVal
            return state
        })
    }

    updateChange(event) {
        let field = event.target.name
        let value = event.target.value

        let changes = {}

        changes[field] = value
        this.setState(changes)
    }

    // Represents metric area calculation elements to render after
    // a metric area is chosen. 
    metricAreaCalculations() {
        let metricCalcElements = null
        if (this.state.currentMetricAreaCalculations.size >= 1 ) {
            metricCalcElements = Array.from(this.state.currentMetricAreaCalculations.
                entries()).map((key) => {
                    let calculation = key[1]
                    console.log(calculation)
                    return <MetricAreaCalcButton
                        metricCalcName={calculation.calcName}
                        metricCalcID={calculation.calcID}
                        metricCalcDataType={calculation.dataType}
                        metricCalcFunc={this.updateSelectedMetricAreaCalculation}
                    />
                })
        } else {
            metricCalcElements = (
                <div>
                    <h4>
                        Choose a metric area
                    </h4>
                </div>
            )
        }
        return metricCalcElements
    }

    // Creates a pop-up with all information from state asking if the
    // user would like to confirm
    // Notes: Check for any null values, if there are null values
    // warn user and let them know they need to update those values.
    // IMPORTANT! If target/actual being submitted is not an annual,
    // allow user to submit null values for highlights, lowlights,
    // and mitigation plans. 
    previewForm(t) {
        if (t) {
            this.setState((state) => {
                state.preview = true
                return state
            })
        }
    }

    // Will switch to preview view when
    // the button is clicked, showing a summary of entered
    // information
    editForm() {
        this.setState((state) => {
            state.preview = false
            return state
        })
    }

    // // Enable preview button
    // // when all the following conditions are met:
    // // 1. Valid Information is entered
    // // 2. All the necessary fields are filled out
    // //      Necessary fields are:
    // //          Data
    // //          Radio
    // //          Month (Enabled by default)
    check() {
        if (this.state.data && this.state.radio && this.state.data !== ""
            && this.state.currentMetricAreaCalculations.size >= 1
            && this.state.selectedMetricAreaCalculations) {
            return true
        }
        let errors = {} // Object to hold errors

        if (!this.state.data) {
            errors["invalidData"] = "A value must be entered"
        }
        if (!this.state.radio) {
            errors["invalidRadio"] = "An actual or target must be selected"
        }
        if (this.state.currentMetricAreaCalculations.size < 1) {
            errors["invalidMetricArea"] = "A metric area must be selected"
        }
        if (!this.state.selectedMetricAreaCalculations) {
            errors["invalidMetricCalc"] = "A metric must be selected"
        }
        errors["errorMsg"] = "Not all required fields have been answered/selected. Check above for more detail."

        this.setState(errors)
        return false
    }

    // Receives a timeDisplay (month, quarter, annual)
    // and returns the appropriate elements for that display
    timeDisplay(time) {
        let x = null
        switch((time)) {
            case "metricGoalsMonths":
                x = (
                <div>
                <h2 id='month'> Month <span class="required">*</span></h2>
                <select
                onChange={(e) => this.updateSelectForm(e)}>
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
            </select>
            </div>)
                break;
            case "metricGoalsQuarters":
                x = (
                <div>
                <h2 id='quarter'> Quarter <span class="required">*</span></h2>
                <select
                onChange={(e) => this.updateSelectForm(e)}>
                    <option selected="selected">None</option>
                    <option value="1">Quarter 1</option>
                    <option value="2">Quarter 2</option>
                    <option value="3">Quarter 3</option>
                    <option value="4">Quarter 4</option>                
                </select>
                </div>
                )
                break;
            case "metricGoalsAnnuals":
                x = (
                    <div>
                        No Action Needed
                    </div>
                )
                break;
        }
        return x
    }

    dataDisplay(dataType) {
        let x = null
        switch((dataType)) {
            case "money":
            case "number":
            case "percent":
                x = (
                    <div class='textInput'>
                    <label for="fname">Enter a value <span class="required">*</span> </label>
                    <input
                        value={this.props.data}
                        onChange={(e) => this.updateChange(e)}
                        type="number" id="form" name="data" />
                    </div>
                )
                    break;
            case "text":
                x = (
                    <div>
                    <label for="fname">Enter text <span class="required">*</span> </label>
                    <input
                        value={this.props.data}
                        onChange={(e) => this.updateChange(e)}
                        type="text" id="form" name="data" />
                    </div>
                )
                break;
        }
        return x
    }

    test(selectTF, tfValue) {
        let x = tfValue
        if (selectTF === "metricGoalsMonths") {
            switch (tfValue) {
                case "January":
                    console.log("January!")
                    x = 1;
                    break;
                case "February":
                    x = 2;
                    break;
                case "March":
                    x = 3;
                    break;
                case "April":
                    x = 4;
                    break;
                case "May":
                    x = 5;
                    break;
                case "June":
                    x = 6
                    break;
                case "July":
                    x = 7
                    break;
                case "August":
                    x = 8
                    break;
                case "September":
                    x = 9
                    break;
                case "October":
                    x = 10
                    break;
                case "November":
                    x = 11
                    break;
                case "December":
                    x = 12
                    break;
                default:
                    x = 1;
            }
        }
        return x
    }

    // Push information to database
    // as a JSON readable format.
    // Check database if enty already exists, if it does, replace values in database
    // otherwise, simply add the new data
    submitForm(dataType, selectTF, tfValue, calcID, radio, data, highlight, lowlight, coe) {
        // Get necessary values for inputting into database...
        // Need: Month, metricCalculationID, and Year

        console.log(dataType)
        let year = new Date()
        year = year.getFullYear()
        // let x = this.test(selectTF, tfValue)
        let x = tfValue

        let rootPath = firebase.database().ref(selectTF)


        let monthString = x.toString()
        // if (x.toString().length === 1) {
        //     monthString = "0" + monthString
        // }
        let keyString = monthString

        rootPath.once('value', (snapshot) => {
            let info = snapshot.val()

            // If metricgoalsMonths does not exist
            // Log error here...
            if (info) {
                let keys = Object.keys(info)
                keys.map((key) => {

                    // If data exists in database...
                    if (key === calcID) {
                        // Check if the data already exists 
                        let childPath = firebase.database().ref(selectTF + '/' +
                            calcID + "/" + year + "/" + keyString)
                        childPath.once('value', (snapshot) => {
                            let cInfo = snapshot.val();
                            // If data exists, overwrite it.
                            if (cInfo) {
                                // If user wants to edit an actual
                                if (radio === "Actual") {
                                    childPath.update({
                                        actual: data,
                                        lowlights: lowlight,
                                        highlights: highlight,
                                        coe: coe,
                                        time: x,
                                        lastEdit: new Date(),
                                        dataType: dataType
                                    })
                                    // If user wants to edit a target
                                } else {
                                    childPath.update({
                                        target: data,
                                        lowlights: lowlight,
                                        highlights: highlight,
                                        coe: coe,
                                        time: x,
                                        lastEdit: new Date(),
                                        dataType: dataType
                                    })
                                }

                                // If data doesn't exist, create new entry.
                            } else {
                                this.newMetricCalculation(dataType, selectTF, radio, calcID, keyString, data, lowlight, highlight, coe, x)
                            }
                        })
                    } else {
                        this.newMetricCalculation(dataType, selectTF, radio, calcID, keyString, data, lowlight, highlight, coe, x)
                    }
                })
            } else {
                this.newMetricCalculation(dataType, selectTF, radio, calcID, keyString, data, lowlight, highlight, coe, x)
            }
        })
    }

    newMetricCalculation(dataType, selectTF, radio, calcID, keyString, data, lowlight, highlight, coe, x) {
        if (radio === "Actual") {
            console.log("Data does not exist yet!")
            console.log("Create a target before inserting an actual!")
        } else {
            // let ref = firebase.database().ref('metricAreas')
            // let id = ref.push().getKey()
            let currentTime = new Date()
            let currentYear = currentTime.getFullYear() + "/"
            firebase.database().ref(selectTF + '/' + calcID + "/" + currentYear + keyString).update({
                target: data,
                lowlights: lowlight,
                highlights: highlight,
                coe: coe,
                time: x,
                actual: "N/A",
                dataType: dataType, 
                inputTime: currentTime
            })
        }
    }

    renderDataEntryForm() {
        return <DataEntryForm
            {...this.state}
            updateSelectForm={this.updateSelectForm}
            updateRadioForm={this.updateRadioForm}
            updateChange={this.updateChange}
            previewForm={this.previewForm}
            submitForm={this.submitForm}
            editForm={this.editForm}
            check={this.check}
            timeDisplay={this.timeDisplay}
            dataDisplay={this.dataDisplay}
        />
    }

    // Represents metric area elements to render on page.
    metricAreaElements() {
        const metricAreaElements = Array.from(this.props.usersMetrics.entries()).map((key) => {
            // Pass metricName, metricID into metricAreaCard as props then also pass in a 
            // list of props containing information about that specific metric
            return <MetricAreaButton
                metricName={key[1].metricName}
                metricID={key[1].metricID}
                metricFunc={this.setMetric}
            />
        })
        return metricAreaElements
    }

    render() {
        const metricAreaElements = this.metricAreaElements()
        const metricAreaCalculationsElements = this.metricAreaCalculations()
        const dataEntryForm = this.renderDataEntryForm()
        let content = null

        if (this.state.selectedMetricAreaCalculations) {
            content = (
                <div>
                    <section id="forms">
                        {dataEntryForm}
                    </section>
                </div>
            )
        } else {
            content = (
                <div>
                  <section class="entry">
                        <h1 className="DataEn"> Data Entry Form </h1>
                        {/* Populate based on whether metric owner owns metric */}
                        <h2 class='MetricTitles'> Metric Area <span class="required">*</span> </h2>
                        <CardDeck className="datadeck">
                            {metricAreaElements}
                        </CardDeck>
                        <div class="errorMsg">
                            <p>{this.state.invalidMetricArea}</p>
                        </div>
                        {/* Populate based on metric chosen */}
                        <h2 class='MetricTitles'> Metric <span class="required">*</span></h2>
                        <CardDeck className="datadeck">
                            {metricAreaCalculationsElements}
                        </CardDeck>
                        <div class="errorMsg">
                            <p>{this.state.invalidMetricCalc}</p>
                        </div>
                    </section>
            </div>
            )
        }

        return (
            <div className="body">
                <main>
                    {content}
                </main>
            </div>
        )
    }
}

// Represents a single metric area to render. Clicking a button
// will render that metric area's calculations
class MetricAreaButton extends Component {
    componentDidUpdate() {
        console.log(this.props)
    }

    render() {
        let typeString = this.props.metricName
        return (
            <button
                class='selection'
                type={typeString}
                value={typeString}
                onClick={() => this.props.metricFunc(this.props.metricName, this.props.metricID)}
            >
                {typeString}
            </button>
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
        let typeString = this.props.metricCalcName
        return (
            <button
                onClick={() => this.props.metricCalcFunc(this.props.metricCalcID, typeString, this.props.metricCalcDataType)}
                class='selection' type={typeString} value={this.props.metricCalcID}>{typeString}</button>
        )
    }
}

// Represents entry form component. 
// This component will take in input from the user
// for data entry. 
export class DataEntryForm extends Component {
    componentDidMount() {
        console.log(this.props)
    }

    componentDidUpdate() {
        console.log(this.props)
    }

    timeDisplayType(selectTf) {
        let x = null
        switch((selectTf)) {
            case "metricGoalsMonth":
                x = (
                    <p>Month: <b>{this.props.tfValue}</b></p>
                )
                break;
            case "metricGoalsQuarters":
                x = (
                    <p>Quarter: <b>{this.props.tfValue}</b></p>
                )
                break;
            case "metricGoalsAnnuals":
                let year = new Date()
                year = year.getFullYear()
                x = (
                    <p>Annual: {year} </p>
                )
                break;
        }
        return x
    }

    render() {
        let content = null
        let timeDisplay = this.props.timeDisplay(this.props.selectTF)
        let dataDisplay = this.props.dataDisplay(this.props.selectedMetricAreaCalculationDataType)
        let timeDisplayType = this.timeDisplayType(this.props.selectTF)

        // Will switch content to be the preview
        if (this.props.preview) {
            content = (
                <div>
                    <div>
                        <h2> Summary of Entered Data </h2>
                        <p>Metric Area: <b>{this.props.metricAreaName}</b></p>
                        <p>Metric: <b>{this.props.selectedMetricAreaCalculationName}</b></p>
                        {/* <p>Month: <b>{this.props.tfValue}</b></p> */}
                        {timeDisplayType}
                        <p>Data Type (Actual/Target): <b>{this.props.radio}</b></p>
                        <p>Data: <b>{this.props.data}</b></p>
                        <p>Highlight: <b>{this.props.highlight}</b></p>
                        <p>Lowlight: <b>{this.props.lowlight}</b></p>
                        <p>Month: <b>{this.props.tfValue}</b></p>
                        <p>MitigationPlan: <b>{this.props.mitigation}</b></p>
                    </div>
                    <button class="preview"
                        onClick={(e) => this.props.editForm(e)}>Edit Data</button>
                    <button class="preview"
                        onClick={() => this.props.submitForm(this.props.selectedMetricAreaCalculationDataType, this.props.selectTF, this.props.tfValue, this.props.selectedMetricAreaCalculations,
                            this.props.radio, this.props.data, this.props.highlight,
                            this.props.lowlight, this.props.mitigation)}>
                        Submit
                    </button>
                </div>
            )
        } else {
            content = (
                <div>
                    <form>
                        <h2 className = "timeFrame">Select a Time Frame <span class="required">*</span> </h2>
                        <select
                            onChange={(e) => this.props.updateChange(e)} name="selectTF">
                            <option value="metricGoalsMonths">Month</option>
                            <option value="metricGoalsQuarters">Quarter</option>
                            <option value="metricGoalsAnnuals">Annual</option>
                        </select>
                        {timeDisplay}
                        <h2 class='InputOption'> Input Data For: <span class="required">*</span> </h2>
                        <div class='CheckBoxes'> 
                            <div class='check-one'>
                                <input class='box' type="checkbox" id="Target" name="Target" value="Target"  onChange={(e) => this.props.updateRadioForm(e)}/>
                                <label class='check' for="Target">Target </label>
                            </div>
                            
                            <div class='check-one'>
                                <input class='box' type="checkbox" id="Actual" name="Actual" value="Actual"  onChange={(e) => this.props.updateRadioForm(e)}/>
                                <label class='check' for="Actual">Actual</label>
                            </div>
                        </div>
                        <div>
                            <p>
                                {this.props.invalidRadio}
                            </p>
                        </div>
                        {/* <h2 className = "timeFrame">Select a data-type <span class="required">*</span> </h2>
                        <select
                            onChange={(e) => this.props.updateChange(e)} name="dataType">
                            <option value="number">Number</option>
                            <option value="percent">Percent</option>
                            <option value="money">Money</option>
                            <option value="text">Text</option>
                        </select> */}
                        {dataDisplay}
                        <div>
                            <p>
                                {this.props.invalidData}
                            </p>
                        </div>
                        <p class='textInput'>
                            <label for="lname">Highlights</label>
                            <textarea
                                placeholder="Write about what went well..."
                                onChange={(e) => this.props.updateChange(e)}
                                value={this.props.highlight} type="text" id="form" name="highlight" />
                        </p>
                        <p class='textInput'>
                            <label for="lname">Lowlights </label>
                            <textarea
                                placeholder="Write about what did not go well..."
                                onChange={(e) => this.props.updateChange(e)}
                                value={this.props.lowlight} type="text" id="form" name="lowlight" />
                        </p>
                        <p class='textInput'>
                            <label for="lname">Mitigation Plan</label>
                            <textarea
                                onChange={(e) => this.props.updateChange(e)}
                                value={this.props.mitigation} type="text" id="form" name="mitigation" />
                        </p>
                    </form>
                    
                    <div>
                        <p>
                            {this.props.errorMsg}
                        </p>
                    </div>
                    
                    <button
                        onClick={() => this.props.previewForm(this.props.check())}
                        class="preview">Preview</button>
                </div>
            )
        }

        return (
            <div>
                {content}
            </div>
        )
    }
}