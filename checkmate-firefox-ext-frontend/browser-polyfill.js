const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Export for use in modules
if (typeof module !== 'undefined') {
  module.exports = browserAPI;
}