//create a variable to hold db connection
let db;
//establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store called 'expense', setting it to auto increment primary keys
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

//upon successful
request.onsuccess = function(event) {
    //when db is successfully created with its store or established, save reference to db in global variable
    db = event.target.result;

    //check if app is online, if yes, run uploadTransaction() function to send all local db data to API
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

//function will be executed if we attempt to submit a new expense and theres no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object store for 'new_transaction'
    const expenseObjectStore = transaction.objectStore('new_transaction');

    //add record to your store with add method
    expenseObjectStore.add(record);
}


function uploadTransaction() {
    //open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access your object store
    const expenseObjectStore = transaction.objectStore('new_transaction');

    //get all records from store and set to a variable
    const getAll = expenseObjectStore.getAll();

    getAll.onsuccess = function() {
        //if there was data in indexedDB's store, let's send it to the API server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json' 
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access the new_transaction object store
                const expenseObjectStore = transaction.objectStore('new_transaction');
                // clear all items in your store
                expenseObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

//listen for app coming back online
window.addEventListener('online', uploadTransaction);