describe('Pool', function(){
	describe('#constructor()', function(){
		it('should register a new type for a class', function(){
			function MyCls() {
			};
			MyCls.prototype.type = 'myCls'

			new Pool(MyCls);

			assert('myCls' in Pool.types);
		});
	})
})
