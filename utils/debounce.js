// ==============================================
//                  debounce.js
// ==============================================

function debounce(fn, delay = 500) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// ==============================================
//                   Exports
// ==============================================

module.exports = debounce;
