require.config({

    shim: {
        "../lib/underscore": { exports: "_" }
    }

});

define(['../lib/underscore'], function(_) {
	describe('underscore', function() {
		it('underscore function', function() {
			expect(_).toBeDefined();
		});
	});
});
