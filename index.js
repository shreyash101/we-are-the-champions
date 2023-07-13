import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://playground-b47fb-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const endorsementListInDB = ref(database, "endorsementList")

const publishBtn = document.getElementById("publish-btn")
const endorsementList = document.getElementById("endorsement-list")
const endorsementInput = document.getElementById("endorsement-textarea")
const fromIp = document.getElementById("from-ip")
const toIp = document.getElementById("to-ip")

const clearEndorsementList = () => {
    endorsementList.innerHTML = ""
}

const clearInputs = () => {
    endorsementInput.value = ""
    fromIp.value = ""
    toIp.value = ""
}

clearInputs()

const addItemToEndorsementList = (endorsementItem) => {
    const endorsementId = endorsementItem[0]
    const endorsementObj = endorsementItem[1]
    
    const endorsement = endorsementObj.endorsement
    const fromPerson = endorsementObj.fromPerson
    const toPerson = endorsementObj.toPerson
    
    let newEl = document.createElement("li")
    newEl.innerHTML = `<div class="endorsement">
                            <p><strong>To ${toPerson}</strong></p>
                            <p>${endorsement}</p>
                            <p><strong>From ${fromPerson}</strong></p>
                       </div>`
    newEl.addEventListener("click", () => {
        let exactLocationOfItemInDB = ref(database, `endorsementList/${endorsementId}`)
        remove(exactLocationOfItemInDB)
    })
    endorsementList.prepend(newEl)
}

publishBtn.addEventListener('click', () => {
    const endorsement = endorsementInput.value.trim()
    const fromPerson = fromIp.value.trim()
    const toPerson = toIp.value.trim()
    if(!endorsement || !fromPerson || !toPerson) return
    const endorsementObj = {
        "endorsement": endorsement,
        "fromPerson": fromPerson,
        "toPerson": toPerson
    }
    push(endorsementListInDB, endorsementObj)
    clearInputs()
})

onValue(endorsementListInDB, (snapshot) => {
    if(snapshot.exists()) {
        
        clearEndorsementList()
        const endorsements = Object.entries(snapshot.val())
        // iterate over endorsements and add them to the list
        endorsements.forEach((endorsement) => {
            addItemToEndorsementList(endorsement)
        })
    }
    else {
        endorsementList.innerHTML = `
                <h3 class="empty-list-msg">No endorsements added yet. Add a new one to make someone feel special</h3>`
    }
})
