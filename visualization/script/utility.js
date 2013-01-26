define([], function () {

	// For d3 style chain-coding
	var propertyAccessor = function (self, config, field) {
		return function (value) {
			if (!arguments.length) {
				return config[field];
			}
			config[field] = value;

			return self;	
		};
	};

	// For d3 style chain-coding
	var delegateProperty = function (self, accessor) {
		return function () {
			if (!arguments.length) {
				return accessor();
			}
			accessor.apply(null, arguments);
			return self;
		};
	};

	return {
		propertyAccessor: propertyAccessor,
		delegateProperty: delegateProperty
	};

});