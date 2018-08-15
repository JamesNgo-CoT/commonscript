/* global DataModel */

/* exported DataCollection */
const DataCollection = Backbone.Collection.extend({

  // PROPERTY DEFINITION

  syncRequiresLogin: false,

  fetchAll: false,

  fetchParameters: {
    $count: false
  },

  model: (...arg) => new DataModel(...arg),

  totalRecords: null,

  // METHOD DEFINITION

  fetch: function(options = {}) {
    this.totalRecords = null;

    const fetchParameters = $.extend({}, _.result(this, 'fetchParameters'), _.result(options, 'fetchParameters'));
    const fetchAll = _.result(options, 'fetchAll', _.result(this, 'fetchAll', false));
    if (fetchAll) {
      fetchParameters['$count'] = true;
      fetchParameters['$skip'] = 0;
      fetchParameters['$top'] = 1;
    }

    const urlParameters = [];
    for (const k in fetchParameters) {
      urlParameters.push(`${k}=${fetchParameters[k]}`)
    }
    options['url'] = [_.result(this, 'url'), urlParameters.join('&')].join('?');

    return Backbone.Collection.prototype.fetch.call(this, options).then(() => {
      if (fetchAll && this.totalRecords > 1 && fetchParameters['$count'] === true && this.totalRecords != null) {
        return this.fetch($.extend(options, {
          fetchParameters: $.extend(_.result(options, 'fetchParameters'), {
            $skip: 0,
            $top: this.totalRecords
          })
        }));
      }
    });
  },

  parse: function(response, options) {
    if (response && !Array.isArray(response)) {
      if (response['@odata.count']) {
        this.totalRecords = response['@odata.count'];
      }

      if (!Array.isArray(response) && response.hasOwnProperty('value')) {
        response = response['value'];
      }
    }

    return Backbone.Collection.prototype.parse.call(this, response, options);
  }
});
