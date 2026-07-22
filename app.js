import * as pdfjsLib from 
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";


pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";


let flaggedUsed = [];

let pdf = null;

let oddPages = [];

let currentIndex = 0;

let flaggedCards = [];

let showingMeaning = false;



const canvas =
document.getElementById("pdfCanvas");


const ctx =
canvas.getContext("2d");



// ========================
// FLAGS
// ========================

function updateFlagButton() {

    const button =
        document.getElementById("flagButton");


    if (!button) return;


    let cardPage =
        oddPages[currentIndex];


    if (flaggedCards.includes(cardPage)) {

        button.textContent = "ðŸš© Flag";

    } else {

        button.textContent = "Flag";

    }

}



function flagCard() {

    let cardPage =
        oddPages[currentIndex];


    if (flaggedCards.includes(cardPage)) {

        flaggedCards =
            flaggedCards.filter(
                page => page !== cardPage
            );

    } else {

        flaggedCards.push(cardPage);

    }


    flaggedUsed = [];

    updateFlagButton();

}



function flagAllCards() {

    if (flaggedCards.length === oddPages.length) {

        flaggedCards = [];

    } else {

        flaggedCards = oddPages.slice();

    }


    flaggedUsed = [];

    updateFlagButton();

}



// ========================
// LOAD PDF
// ========================

async function loadPDF() {


    pdf =
    await pdfjsLib
    .getDocument("tarot.pdf")
    .promise;



    oddPages = [];


    for (
        let page = 1;
        page <= pdf.numPages;
        page++
    ) {

        if (page % 2 === 1) {

            oddPages.push(page);

        }

    }



    currentIndex = 0;

    showingMeaning = false;


    displayCurrentPage();

}



// ========================
// DISPLAY CARD
// ========================

function displayCurrentPage() {


    let pageNumber;


    if (showingMeaning) {

        pageNumber =
        oddPages[currentIndex] + 1;


        if (pageNumber > pdf.numPages) {

            pageNumber =
            oddPages[currentIndex];

        }

    } else {

        pageNumber =
        oddPages[currentIndex];

    }


    displayPage(pageNumber);


    updateFlagButton();

}



// ========================
// DISPLAY PDF PAGE
// ========================

async function displayPage(pageNumber) {


    const page =
    await pdf.getPage(pageNumber);



    const original =
    page.getViewport({
        scale: 1
    });



    const availableWidth =
    window.innerWidth * 0.90;



    const availableHeight =
    (window.innerHeight - 120) * 0.90;



    const scale =
    Math.min(
        availableWidth / original.width,
        availableHeight / original.height
    );



    const viewport =
    page.getViewport({
        scale: scale
    });



    canvas.width =
    viewport.width;


    canvas.height =
    viewport.height;



    canvas.style.width =
    viewport.width + "px";


    canvas.style.height =
    viewport.height + "px";



    await page.render({

        canvasContext: ctx,

        viewport: viewport

    }).promise;

}



// ========================
// RANDOM FLAGGED CARD
// ========================

function newReading() {


    if (flaggedCards.length === 0) {

        alert("No flagged cards yet");

        return;

    }



    if (flaggedUsed.length >= flaggedCards.length) {

        flaggedUsed = [];

    }



    let available =
    flaggedCards.filter(
        page =>
        !flaggedUsed.includes(page)
    );



    let page =
    available[
        Math.floor(
            Math.random() *
            available.length
        )
    ];



    flaggedUsed.push(page);



    currentIndex =
    oddPages.indexOf(page);



    showingMeaning = false;


    displayCurrentPage();

}



// ========================
// NEXT / PREVIOUS
// ========================

function nextCard() {


    showingMeaning = false;


    currentIndex++;


    if (currentIndex >= oddPages.length) {

        currentIndex = 0;

    }


    displayCurrentPage();

}



function previousCard() {


    showingMeaning = false;


    currentIndex--;


    if (currentIndex < 0) {

        currentIndex =
        oddPages.length - 1;

    }


    displayCurrentPage();

}



// ========================
// SHOW MEANING
// ========================

function showMeaning() {


    showingMeaning =
    !showingMeaning;


    displayCurrentPage();

}



// ========================
// BUTTONS
// ========================

window.newReading =
newReading;

window.nextCard =
nextCard;

window.previousCard =
previousCard;

window.showMeaning =
showMeaning;

window.flagCard =
flagCard;

window.flagAllCards =
flagAllCards;



// ========================
// POINTER SWIPE
// MOUSE + TOUCH
// ========================

let pointerStartX = 0;

let pointerDown = false;


canvas.addEventListener(
"pointerdown",
function(e) {


    pointerDown = true;


    pointerStartX =
    e.clientX;


    canvas.setPointerCapture(
        e.pointerId
    );

});



canvas.addEventListener(
"pointerup",
function(e) {


    if (!pointerDown) return;


    pointerDown = false;


    let distance =
    e.clientX - pointerStartX;



    if (distance < -50) {

        nextCard();

    }

    else if (distance > 50) {

        previousCard();

    }

    else {

        showMeaning();

    }


});



canvas.addEventListener(
"pointercancel",
function() {

    pointerDown = false;

});



// ========================
// RESIZE
// ========================

let resizeTimer;


window.addEventListener(
"resize",
function() {


    clearTimeout(resizeTimer);


    resizeTimer =
    setTimeout(
        () => {
            displayCurrentPage();
        },
        150
    );


});



loadPDF();
