/* exported syncFactory */
function syncFactory(sync, login, originatingElement) {
  return (method, model, options = {}) => {
    const deferred = $.Deferred();

    Promise.resolve().then(() => {
      if (login && (_.result(model.model, 'syncRequiresLogin') || _.result(model, 'syncRequiresLogin'))) {
        return login.requireLogin({
          originatingElement: originatingElement
        });
      }
    }).then(() => {
      if (login && (_.result(model.model, 'syncRequiresLogin') || _.result(model, 'syncRequiresLogin'))) {
        options.beforeSend = (jqXHR) => {
          jqXHR.setRequestHeader('Authorization', `AuthSession ${login.sid}`);
        };
      }

      options.contentType = options.contentType || 'application/json';

      options.error = function(jqXHR, status, errorThrown) {
        const errorMessageTemplate = _.template(`An error ocurred. Error code <%- status %>. <%= message %>`);
        if (jqXHR.status >= 500 && jqXHR.status <= 599) {
          alert(errorMessageTemplate({
            status: jqXHR.status,
            message: 'Server side error. Please contact your administrator.'
          }));
        } else if (jqXHR.status === 400 && !jqXHR.responseJSON && jqXHR.responseText && jqXHR.responseText.indexOf('Session id') !== -1
        && jqXHR.responseText.indexOf('is invalid') !== -1) {
          if (login && (_.result(model.model, 'syncRequiresLogin') || _.result(model, 'syncRequiresLogin'))) {
            login.showLogin({
              onHidden: () => {
                login.checkLogin(options).then(() => {
                  model.trigger('reloadNeeded');
                }, () => {
                  if (login.sid) {
                    login.logout();
                  }
                });
              },
              originatingElement: originatingElement
            });
          } else {
            alert(errorMessageTemplate({
              status: jqXHR.status,
              message: jqXHR.responseText
            }));
          }
        } else if (jqXHR.status === 404) {
          // DO NOTHING - TODO - THINK MORE ABOUT SIDE EFFECTS
        } else if (jqXHR.responseJSON && jqXHR.responseJSON.error && jqXHR.responseJSON.error.message) {
          alert(errorMessageTemplate({
            status: jqXHR.status,
            message: jqXHR.responseJSON.error.message
          }));
        } else if (jqXHR.responseText) {
          alert(errorMessageTemplate({
            status: jqXHR.status,
            message: jqXHR.responseTextrThrown
          }));
        } else {
          alert(errorMessageTemplate({
            status: jqXHR.status,
            message: errorThrown
          }));
        }
      };

      sync.call(this, method, model, options).then((...args) => {
        deferred.resolve(...args);
      }, (...args) => {
        deferred.reject(...args);
      });
    });

    return deferred;
  }
}
