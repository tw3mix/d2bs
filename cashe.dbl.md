
```
js_strict(true);

var Cache = new function() {
	this.Load = function(name) {
		var path = 'cache/'+name+'.json';
		if (!FileTools.exists(path)) return undefined;
		var obj = eval('('+FileTools.readText(path)+')');
		return obj.data;
	};
	this.Save = function(name, data, validFor) {
		var obj = {
			
			data:data;
		};
		FileTools.writeText('cache/'+name+'.json',obj.toSource());
	};
};
```
