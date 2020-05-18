import React, { Component } from 'react';
import './css/AdminSettings.css';
import Switch from "react-switch";
import { AdminPanelNav } from './AdminPanel';
import Off from './img/toggle.svg';
import On from './img/switch.svg'
import firebase from 'firebase/app';

// Not sure if AdminPanelNav is redundant. It is in the Admin panel js file
export class AdminSettings extends Component {
    constructor(props) {
        super(props)

        this.removeAdmin = this.removeAdmin.bind(this)
        this.handleAToggle = this.handleAToggle.bind(this)
        this.handleTToggle = this.handleTToggle.bind(this)

        this.state = {
            enableEdit: false,
            modalDisplay: "none",
            currentAdmins: new Map(),
            currentUsers: new Map()
        }
    }

    componentDidMount() {
        this.retrieveAdminUsers()
        this.retrieveActualSettings()
        this.retrieveTargetSettings()
        console.log(this.props)
    }

    componentDidUpdate() {
        console.log(this.state)
        // this.retrieveAdminUsers()
    }

    retrieveAdminUsers() {
        let rootPath = firebase.database().ref('admins')
        rootPath.once('value', (snapshot) => {
            let info = snapshot.val()
            let usersMap = new Map()

            // If the admins reference exists in the database
            // or if something exists in the database for admins
            if (info) {
                let keys = Object.keys(info)
                keys.map((key) => {
                    usersMap.set(key, info[key])
                })
            }

            this.setAdminUsers(usersMap)
        })
    }

    setAdminUsers(users) {
        this.setState((state) => {
            state.currentAdmins = users
            return state
        })
    }

    renderAdminUsers() {
        const adminElements = Array.from(this.state.currentAdmins.entries()).map((key) => {
            return <AdminItem
                admin={key[1].userName}
                adminID={key[1].adminID}
                userID={key[1].userID}
                removeAdmin={this.removeAdmin}
                enableEdit={this.state.enableEdit}
            />
        })
        return adminElements
    }

    removeAdmin(removedAdmin) {
        let rootPath = firebase.database().ref('admins')

        rootPath.once('value', (snapshot) => {
            let info = snapshot.val();
            let keys = Object.keys(info)

            keys.map((key) => {
                if (key === removedAdmin) {
                    let refPath = 'admins/' + removedAdmin
                    firebase.database().ref(refPath).remove()
                }
            })
        })

        let usersMap = this.state.currentAdmins
        usersMap.delete(removedAdmin)
        this.setAdminUsers(usersMap)
    }

    editAdminInfo() {
        this.setState((state) => {
            state.enableEdit = true
            return state
        })
    }

    // Renders modal form for adding users
    openModal() {
        this.setState((state) => {
            this.state.modalDisplay = "block"
            return state
        })
    }

    // Closes modal form for adding users
    closeForm() {
        this.setState((state) => {
            state.modalDisplay = "none"
            return state
        })
    }

    addOwner(e) {
        e.preventDefault()
        let adminExist = this.adminExists()

        console.log(e.target.value)

        // If the user does not exist, add them to the owners
        if (adminExist) {
            let rootString = firebase.database().ref('admins/' + this.state.currentUserID)
            let id = rootString.push().getKey()
            let userObject = {
                userID: this.state.currentUserID,
                userName: this.state.currentUserName,
                adminID: id
            }
            firebase.database().ref('admins/' + id.toString()).update({
                userID: this.state.currentUserID,
                userName: this.state.currentUserName,
                adminID: id
            })

            let usersMap = this.state.currentAdmins
            usersMap.set(id, userObject)
            this.setAdminUsers(usersMap)

            this.closeForm()
        } else {
            // Need to make a error display 
            console.log("Selected user is already an admin!")
        }
    }

    // Check if the selected user already exists
    // If the user is already an admin, notify the system
    adminExists() {
        let admins = this.state.currentAdmins
        let adminExist = true
        admins.forEach((key) => {
            if (key.userID === this.state.currentUserID) {
                adminExist = false
            }
        })
        return adminExist
    }

    // Put in app and send down
    cancelEdit() {
        this.setState((state) => {
            state.enableEdit = false
            return state
        })
    }

    // Handles changes for 
    handleChange = (event) => {
        let field = event.target.name
        let value = event.target.value

        let changes = {}

        changes[field] = value
        this.setState(changes)
    }

    // Update the currently selected user
    updateUser(event) {
        const selected = event.target.options.selectedIndex
        let id = (event.target.options[selected].getAttribute('id'))
        let user = event.target.value
        this.setState((state) => {
            state.currentUserID = id
            state.currentUserName = user
            return state
        })
    }

    // Returns all current users in SightLife as 
    // <option> elements
    usersList() {
        console.log(this.props.users)
        const usersElements = Array.from(this.props.users.entries()).map((key) => {
            let name = key[1].fName + " " + key[1].lName
            return <UserItem
                name={name}
                uid={key[1].uid}
            />
        })
        return usersElements
    }

    addForm() {
        let usersList = this.usersList()
        let form = (
            <div
                id="formOne"
                style={{ display: this.state.modalDisplay }}>
                <div>
                    <form id="formBox">
                        <h2>Select an Admin</h2>
                        <div>
                            <label>
                                <select
                                    onChange={(e) => this.updateUser(e)}>
                                    <option value="None" disabled selected>Select a user</option>
                                    {usersList}
                                </select>
                            </label>
                            <button onClick={(e) => this.addOwner(e)}>
                                Submit
                    </button>
                            <button
                                onClick={() => this.closeForm()}>
                                Cancel
                    </button>
                        </div>
                    </form>
                </div>
            </div>
        )
        return form
    }

    handleAToggle(actualToggle) {
        this.setState({
            actualToggle
        })
    }

    handleTToggle(targetToggle) {
        this.setState({
            targetToggle
        })
    }

    retrieveActualSettings() {
        let actual = null
        let actualSettings = firebase.database().ref('dataEntrySettings/actualEnabled')
        actualSettings.once('value', (snapshot) => {
            let info = snapshot.val()
            actual = info
            console.log(actual)
            this.setState((state) => {
                state.actualToggle = actual
                return state
            })
        })
    }

    retrieveTargetSettings() {
        let target = null
        let targetSettings = firebase.database().ref('dataEntrySettings/targetEnabled')
        targetSettings.once('value', (snapshot) => {
            let info = snapshot.val()
            target = info
            this.setState((state) => {
                state.targetToggle = target
                return state
            })
        })
    }

    saveSettings(target, actual) {
        firebase.database().ref('dataEntrySettings').update({
            actualEnabled: actual,
            targetEnabled: target
        })
    }

    render() {
        let content = null
        let form = this.addForm()
        const adminElements = this.renderAdminUsers()

        if (this.state.enableEdit) {
            content = (
                <div class="adminButtons">
                    <button
                        onClick={() => this.openModal()}>
                        Add Admin
                    </button>
                    <button
                        onClick={() => this.cancelEdit()}>
                        Cancel
                    </button>
                </div>
            )
        } else {
            content = (
                <div class="adminButtons">
                    <button
                        value="test"
                        class="edit"
                        onClick={() => this.editAdminInfo()}>
                        Edit Owners
                </button>
                </div>
            )
        }

        return (
            <div className="body">
                <main>
                    <AdminPanelNav />

                    <h1 class="ASettingsTitle"> Settings </h1>

                    <div class="main_content2">
                        <div class="columnSettings">
                            <section class="PermInfo">
                                <div class="PermissionBox">
                                    <h3 class='PermissionText'> Admin Information </h3>
                                </div>
                                <div class="PermissionInfo">
                                    <p class="PermText2"> Owner(s) </p>
                                    <div id="ownerElements">
                                        <ul>
                                            <div id="test">
                                                {adminElements}
                                            </div>
                                        </ul>
                                    </div>
                                    {content}
                                </div>
                            </section>
                        </div>

                        {form}

                        <div class="columnSettings">
                            <section class="PermInfo">
                                <div class="PermissionBox">
                                    <h3 class='PermissionText'> Data Entry Form Settings </h3>
                                </div>

                                <div class="PermissionInfo">
                                    <div id="entryFormSettings">
                                        <label>
                                            <span>Data Entry for Actuals:</span></label>
                                        <Switch
                                            uncheckedIcon={false}
                                            checkedIcon={false}
                                            onChange={this.handleAToggle}
                                            checked={this.state.actualToggle}
                                            className="react-switch"
                                        />
                                        <label>
                                            <span>Data Entry for Targets:</span></label>
                                        <Switch
                                            className="react-switch"
                                            uncheckedIcon={false}
                                            checkedIcon={false}
                                            onChange={this.handleTToggle}
                                            checked={this.state.targetToggle}
                                        />
                                    </div>
                                </div>

                            </section>
                        </div>

                        <div class='Save2Button'>
                            <button
                                onClick={() => this.saveSettings(this.state.targetToggle, this.state.actualToggle)}
                                class='save2' type="Save" value="Save"> Save </button>
                        </div>
                    </div>

                </main>
            </div>
        )
    }
}

class UserItem extends Component {
    render() {
        return (
            <option value={this.props.name} id={this.props.uid}>
                {this.props.name}
            </option>
        )
    }
}

class AdminItem extends Component {
    render() {
        let button = !this.props.enableEdit ? <div></div> : <button
            onClick={() => { this.props.removeAdmin(this.props.adminID) }}>-
        </button>

        return (
            <li className="test">
                {this.props.admin}
                {button}
            </li>
        )
    }
}