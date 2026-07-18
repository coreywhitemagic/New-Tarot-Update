import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

let flaggedUsed = [];
let pdf = null;
let oddPages = [];
let currentIndex = 0;
let usedPages = [];
let flaggedCards = [];
let showingMeaning = false;

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

// ========================
// FLAG BUTTON
// ========================
function updateFlagButton() {
  const button = document.getElementById("flagButton");
  if (!button) return;

  let cardPage = oddPages[currentIndex];

  if (flaggedCards.includes(cardPage)) {
    button.innerHTML = "🚩 Flag";
  } else {
    button.innerHTML = "Flag";
  }
}

function flagCard() {
  let cardPage = oddPages[currentIndex];

  if (flaggedCards.includes(cardPage)) {
    flaggedCards = flaggedCards.filter(page => page !== cardPage);
  } else {
    flaggedCards.push(cardPage);
  }

  updateFlagButton();
}

function flagAllCards() {
  if (flaggedCards.length === oddPages.length) {
    // Unflag all cards
    flaggedCards = [];
  } else {
    // Flag all cards
    flaggedCards = oddPages.slice();
  }

  updateFlagButton();
}

// ========================
// LOAD PDF
// ========================
async function loadPDF() {
  pdf = await pdfjsLib.getDocument("tarot.pdf").promise;

  oddPages = [];

  for (let page = 1; page <= pdf.numPages; page++) {
    if (page % 2 === 1) {
      oddPages.push(page);
    }
  }

  // Always start with The Fool
  currentIndex = 0;
  usedPages = [oddPages[0]];
  showingMeaning = false;

  displayCurrentPage();
}

// ========================
// DISPLAY CURRENT CARD
// ========================
function displayCurrentPage() {
  let pageNumber;

  if (showingMeaning) {
    pageNumber = oddPages[currentIndex] + 1;
  } else {
    pageNumber = oddPages[currentIndex];
  }

  displayPage(pageNumber);
  updateFlagButton();
}

// ========================
// DISPLAY PDF PAGE (FIT SCREEN)
// ========================
async function displayPage(pageNumber) {
  const page = await pdf.getPage(pageNumber);

  const original = page.getViewport({ scale: 1 });

  // Leave room for buttons
  const availableWidth = window.innerWidth * 0.9;
  const availableHeight = (window.innerHeight - 120) * 0.9;

  // Fit PDF inside available space
  const scale = Math.min(
    availableWidth / original.width,
    availableHeight / original.height
  );

  const viewport = page.getViewport({ scale: scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  canvas.style.width = viewport.width + "px";
  canvas.style.height = viewport.height + "px";

  await page.render({
    canvasContext: ctx,
    viewport: viewport
  }).promise;
}

// ========================
// NEW READING
// ========================
function newReading() {
  if (flaggedCards.length === 0) {
    alert("No flagged cards yet");
    return;
  }

  // Reset cycle when all flagged cards have been used
  if (flaggedUsed.length >= flaggedCards.length) {
    flaggedUsed = [];
  }

  // Cards not yet used in this cycle
  let available = flaggedCards.filter(
    page => !flaggedUsed.includes(page)
  );

  // Pick random unused flagged card
  let page = available[Math.floor(Math.random() * available.length)];

  // Remember it was used
  flaggedUsed.push(page);

  currentIndex = oddPages.indexOf(page);
  showingMeaning = false;

  displayCurrentPage();
}

// ========================
// NEXT
// ========================
function nextCard() {
  showingMeaning = false;

  currentIndex++;

  if (currentIndex >= oddPages.length) {
    currentIndex = 0;
  }

  displayCurrentPage();
}

// ========================
// PREVIOUS
// ========================
function previousCard() {
  showingMeaning = false;

  currentIndex--;

  if (currentIndex < 0) {
    currentIndex = oddPages.length - 1;
  }

  displayCurrentPage();
}

// ========================
// SHOW MEANING TOGGLE
// ========================
function showMeaning() {
  showingMeaning = !showingMeaning;
  displayCurrentPage();
}

// ========================
// RESIZE
// ========================
window.addEventListener("resize", () => {
  displayCurrentPage();
});

// Make buttons work from HTML
window.newReading = newReading;
window.nextCard = nextCard;
window.previousCard = previousCard;
window.showMeaning = showMeaning;
window.flagCard = flagCard;
window.flagAllCards = flagAllCards;

// ========================
// MOBILE SWIPE CONTROLS
// ========================
let touchStartX = 0;
let touchEndX = 0;

canvas.addEventListener(
  "touchstart",
  function (e) {
    touchStartX = e.changedTouches[0].screenX;
  },
  false
);

canvas.addEventListener(
  "touchend",
  function (e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  },
  false
);

function handleSwipe() {
  let swipeDistance = touchEndX - touchStartX;

  // Swipe left = next card
  if (swipeDistance < -50) {
    nextCard();
  }

  // Swipe right = previous card
  if (swipeDistance > 50) {
    previousCard();
  }
}

// ========================
// TAP CARD TO TOGGLE MEANING
// ========================
let touchMoved = false;

canvas.addEventListener("touchstart", function () {
  touchMoved = false;
});

canvas.addEventListener("touchmove", function () {
  touchMoved = true;
});

canvas.addEventListener("touchend", function () {
  // Only count as a tap, not a swipe
  if (!touchMoved) {
    showMeaning();
  }
});

// ========================
// INIT
// ========================
loadPDF();
