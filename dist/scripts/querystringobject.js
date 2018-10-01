'use strict';

/* exported queryStringToObject */
function queryStringToObject(queryString) {
	var queryObject = {};

	if (queryString) {
		var params = queryString.split('&');
		for (var index = 0, length = params.length; index < length; index++) {
			if (!params[index]) {
				continue;
			}

			var nameValue = params[index].split('=');
			var name = decodeURIComponent(nameValue[0]);
			var value = decodeURIComponent(nameValue[1] != null ? nameValue[1] : nameValue[0]);
			queryObject[name] = value;
		}
	}

	return queryObject;
}

/* exported queryObjectToString */
function queryObjectToString(queryObject) {
	var queryArray = [];

	if (queryObject) {
		for (var key in queryObject) {
			if (queryObject.hasOwnProperty(key) && queryObject[key] != null) {
				var name = encodeURIComponent(key);
				var value = encodeURIComponent(queryObject[key]);
				queryArray.push(name + '=' + value);
			}
		}
	}

	return queryArray.join('&');
}