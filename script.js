
"use strict";

// ======================================
// 1. GET HTML ELEMENTS
// ======================================

const display = document.getElementById("display");
const history = document.getElementById("history");
const keypad = document.getElementById("keypad");
const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ======================================
// 2. CALCULATOR STATE
// ======================================

let currentValue = "0";
let storedValue = null;
let pendingOperator = null;
let waitingForNextValue = false;
let justCalculated = false;
let errorState = false;

// ======================================
// 3. DISPLAY HELPERS
// ======================================

function updateDisplay() {
  if (display) {
    display.textContent = currentValue;
  }
}

function updateHistory(text = "") {
  if (history) {
    history.textContent = text;
  }
}

function resetCalculator() {
  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  waitingForNextValue = false;
  justCalculated = false;
  errorState = false;

  updateHistory("");
  updateDisplay();
}

function showError(message) {
  currentValue = message;
  storedValue = null;
  pendingOperator = null;
  waitingForNextValue = true;
  justCalculated = false;
  errorState = true;

  updateHistory("");
  updateDisplay();
}

// ======================================
// 4. NUMBER FORMATTING
// ======================================

function formatNumber(number) {
  if (!Number.isFinite(number)) {
    throw new Error("Invalid result");
  }

  // Avoid displaying floating-point artifacts.
  const rounded = Number(number.toPrecision(12));

  if (Math.abs(rounded) >= 1e12 ||
      (rounded !== 0 && Math.abs(rounded) < 1e-8)) {
    return rounded.toExponential(6);
  }

  return String(rounded);
}

function getCurrentNumber() {
  const number = Number(currentValue);

  if (!Number.isFinite(number)) {
    throw new Error("Invalid number");
  }

  return number;
}

// ======================================
// 5. INPUT NUMBERS
// ======================================

function inputNumber(number) {
  if (errorState) {
    resetCalculator();
  }

  if (waitingForNextValue ||
      justCalculated ||
      currentValue === "0") {
    currentValue = number;
    waitingForNextValue = false;
    justCalculated = false;
  } else {
    // Prevent unnecessarily long numbers.
    if (currentValue.replace(/[-.]/g, "").length >= 15) {
      return;
    }

    currentValue += number;
  }

  updateDisplay();
}

// ======================================
// 6. DECIMAL INPUT
// ======================================

function inputDecimal() {
  if (errorState) {
    resetCalculator();
  }

  if (waitingForNextValue || justCalculated) {
    currentValue = "0.";
    waitingForNextValue = false;
    justCalculated = false;
    updateDisplay();
    return;
  }

  if (!currentValue.includes(".")) {
    currentValue += ".";
    updateDisplay();
  }
}

// ======================================
// 7. ARITHMETIC OPERATIONS
// ======================================

function calculate(first, second, operator) {
  let result;

  switch (operator) {
    case "+":
      result = first + second;
      break;

    case "-":
      result = first - second;
      break;

    case "*":
      result = first * second;
      break;

    case "/":
      if (second === 0) {
        throw new Error("Cannot divide by zero");
      }

      result = first / second;
      break;

    default:
      return second;
  }

  if (!Number.isFinite(result)) {
    throw new Error("Result out of range");
  }

  return result;
}

// ======================================
// 8. SELECT AN OPERATOR
// ======================================

function chooseOperator(operator) {
  if (errorState) {
    resetCalculator();
    return;
  }

  const inputValue = getCurrentNumber();

  if (pendingOperator && !waitingForNextValue) {
    try {
      const result = calculate(
        storedValue,
        inputValue,
        pendingOperator
      );

      currentValue = formatNumber(result);
      storedValue = result;
      updateDisplay();
    } catch (error) {
      showError(error.message);
      return;
    }
  } else if (storedValue === null || justCalculated) {
    storedValue = inputValue;
  }

  pendingOperator = operator;
  waitingForNextValue = true;
  justCalculated = false;

  const symbols = {
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷"
  };

  updateHistory(`${formatNumber(storedValue)} ${symbols[operator]}`);
}

// ======================================
// 9. EQUALS BUTTON
// ======================================

function calculateResult() {
  if (errorState) return;

  if (pendingOperator === null ||
      storedValue === null ||
      waitingForNextValue) {
    return;
  }

  const first = storedValue;
  const second = getCurrentNumber();

  const symbols = {
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷"
  };

  const expression =
    `${formatNumber(first)} ${symbols[pendingOperator]} ` +
    `${formatNumber(second)} =`;

  try {
    const result = calculate(first, second, pendingOperator);

    currentValue = formatNumber(result);
    storedValue = null;
    pendingOperator = null;
    waitingForNextValue = true;
    justCalculated = true;

    updateHistory(expression);
    updateDisplay();
  } catch (error) {
    showError(error.message);
  }
}

// ======================================
// 10. PERCENTAGE
// ======================================

function calculatePercent() {
  if (errorState) {
    resetCalculator();
    return;
  }

  try {
    const number = getCurrentNumber();

    // Converts the displayed value to its percentage.
    currentValue = formatNumber(number / 100);
    waitingForNextValue = false;
    justCalculated = false;

    updateDisplay();
  } catch (error) {
    showError(error.message);
  }
}

// ======================================
// 11. CHANGE SIGN
// ======================================

function changeSign() {
  if (errorState) {
    resetCalculator();
    return;
  }

  if (getCurrentNumber() === 0) return;

  currentValue = currentValue.startsWith("-")
    ? currentValue.slice(1)
    : "-" + currentValue;

  justCalculated = false;
  updateDisplay();
}

// ======================================
// 12. DELETE LAST CHARACTER
// ======================================

function deleteLast() {
  if (errorState || waitingForNextValue || justCalculated) {
    resetCalculator();
    return;
  }

  if (currentValue.length <= 1 ||
      (currentValue.length === 2 && currentValue.startsWith("-"))) {
    currentValue = "0";
  } else {
    currentValue = currentValue.slice(0, -1);
  }

  updateDisplay();
}

// ======================================
// 13. BUTTON ACTIONS
// ======================================

function handleAction(action) {
  switch (action) {
    case "clear":
      resetCalculator();
      break;

    case "delete":
      deleteLast();
      break;

    case "decimal":
      inputDecimal();
      break;

    case "percent":
      calculatePercent();
      break;

    case "sign":
      changeSign();
      break;

    case "equals":
      calculateResult();
      break;
  }
}

// Use one event listener for all calculator buttons.
if (keypad) {
  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button || !keypad.contains(button)) return;

    if (button.dataset.number !== undefined) {
      inputNumber(button.dataset.number);
      return;
    }

    if (button.dataset.operator) {
      chooseOperator(button.dataset.operator);
      return;
    }

    if (button.dataset.action) {
      handleAction(button.dataset.action);
    }
  });
}

// ======================================
// 14. KEYBOARD SUPPORT
// ======================================

document.addEventListener("keydown", (event) => {
  // Don't intercept keys while typing into a form field.
  if (
    event.target instanceof HTMLElement &&
    (
      event.target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)
    )
  ) {
    return;
  }

  const key = event.key;

  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    inputNumber(key);
    return;
  }

  if (key === "." || key === ",") {
    event.preventDefault();
    inputDecimal();
    return;
  }

  if (["+", "-", "*", "/"].includes(key)) {
    event.preventDefault();
    chooseOperator(key);
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculateResult();
    return;
  }

  if (key === "Backspace") {
    event.preventDefault();
    deleteLast();
    return;
  }

  if (key === "Escape" || key === "Delete") {
    event.preventDefault();
    resetCalculator();
    return;
  }

  if (key === "%") {
    event.preventDefault();
    calculatePercent();
  }
});

// ======================================
// 15. INITIAL DISPLAY
// ======================================

updateDisplay();
updateHistory("");
