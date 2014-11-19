
// SYSTEM TXT LOG
// ========================================================================================================
   global.stdout = function()
   {
		var arg = [].slice.call(arguments);
		var dte = new Date().to('Y-M-D h:m:s');

		if ((typeof arg[0] != 'string') && (typeof arg[0] != 'number'))
		{
			arg.unshift("\n");
			arg.push("\n");
		}
		else
		{
			if (typeof arg[0] == 'string')
			{
				arg[0] = arg[0].trim();

				if (arg[0].indexOf("\n") > 0)
				{
					arg.unshift("\n");
					arg.push("\n");
				}
			}
		}

		arg.unshift(dte+"\t");

		console.log.apply(console, arg);
   };
// ========================================================================================================


// SYSTEM ERR LOG
// ========================================================================================================
   global.stderr = function()
   {
		var arg = [].slice.call(arguments);
		var dte = new Date().to('Y-M-D h:m:s');
		var msg = '';

		if ((typeof arg[0] == 'object') && (typeof arg[0].stack == 'string'))
		{ arg[0] = arg[0].stack; }

		if ((typeof arg[0] != 'string') && (typeof arg[0] != 'number'))
		{
			arg.unshift("\n");
			arg.push("\n");
		}
		else
		{
			if (typeof arg[0] == 'string')
			{
				arg[0] = arg[0].trim();

				if (arg[0].indexOf("\n") > 0)
				{
					arg.unshift("\n");
					arg.push("\n");
				}
			}
		}

		arg.unshift(dte+"\t");

		for (var i in arg)
		{ msg += arg[i]; }

		console.error(msg);
   };
// ========================================================================================================
