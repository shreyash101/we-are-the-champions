import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove, runTransaction } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

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

const storedEndorsements = JSON.parse(localStorage.getItem("endorsementIds")) || []

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
    let endorsementLikes = endorsementObj.count
    
    let newEl = document.createElement("li")
    newEl.innerHTML = `<div class="endorsement">
                            <p><strong>To ${toPerson}</strong></p>
                            <p>${endorsement}</p>
                            <p class="from-person"><strong>From ${fromPerson}</strong></p>
                            <p id="${endorsementId}" class="likes">❤ ${endorsementLikes}</p>
                       </div>`
    newEl.addEventListener("click", (e) => {
        // if pressed on like, add endorsement id to likes array, update local storage and update it in firebase db
        let endorsementInd = storedEndorsements.indexOf(endorsementId)
        if(e.target.id == endorsementId) {
            // if endorsementId is present in likes array, means already liked, hence unlike --> remove from local storage and update it, decrement count by 1 in firebase
            if(endorsementInd > -1) {
                storedEndorsements.splice(endorsementInd, 1)
                decrementEndorsementLikeInFirebase(endorsementId)
            }
            // if endorsement absent in likes, store like id in array, update in storage and
            // increment count by 1 in firebase  
            else {
                storedEndorsements.push(endorsementId)
                incrementEndorsementLikeInFirebase(endorsementId)
            }
        }
        // if pressed on item, delete it from db, delete endorsement id from likes array and update local storage
        else {
            let exactLocationOfItemInDB = ref(database, `endorsementList/${endorsementId}`)
            remove(exactLocationOfItemInDB)
            storedEndorsements.splice(endorsementInd, 1)
        }
        localStorage.setItem("endorsementIds", JSON.stringify(storedEndorsements))
    })
    endorsementList.appendChild(newEl)
}

function incrementEndorsementLikeInFirebase(id){
    let exactLocationOfItemInDB = ref(database, `endorsementList/${id}/count`);
    runTransaction(exactLocationOfItemInDB, (count) => {
        if (count === null) {
          return 1; 
        } 
        else {
            return count + 1; 
        }
    })
    .then(() => {
    //   console.log('Likes count incremented successfully!');
    })
    .catch((error) => {
        console.log('Error incrementing likes count: ' + error.message);
    });
}

function decrementEndorsementLikeInFirebase(id){
    let exactLocationOfItemInDB = ref(database, `endorsementList/${id}/count`);
    runTransaction(exactLocationOfItemInDB, (count) => {
        if (count === null || count === 0) {
            return 0; 
        }
        else {
            return count - 1; 
        }
    })
    .then(() => {
    //   console.log('Likes count incremented successfully!');
    })
    .catch((error) => {
        console.log('Error incrementing likes count: ' + error.message);
    });
}

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

publishBtn.addEventListener('click', () => {
    const endorsement = endorsementInput.value.trim()
    const fromPerson = fromIp.value.trim()
    const toPerson = toIp.value.trim()
    if(!endorsement || !fromPerson || !toPerson) return
    const endorsementObj = {
        "endorsement": endorsement,
        "fromPerson": fromPerson,
        "toPerson": toPerson,
        "count": 0,
    }
    push(endorsementListInDB, endorsementObj)
    clearInputs()
})