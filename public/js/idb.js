// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open("budget_tracker", 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the database 
  const db = event.target.result;
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

// success
request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit data and there's no internet connection
function saveRecord(record) {
  const transaction = db.transaction(["new_transaction"], "readwrite");
  const budgetObjectStore = transaction.objectStore("new_transaction");
  // add record to your store with add method
  budgetObjectStore.add(record);
};

// when a user is online
function uploadTransaction() {
  // open a transaction on your db
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('new_transaction');
  // get all transactions from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
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
          alert("Your offline transactions has been saved!");
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_transaction');
          // clear all items in your store
          budgetObjectStore.clear();
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
};

// listen for app coming back online
window.addEventListener("online", uploadTransaction);