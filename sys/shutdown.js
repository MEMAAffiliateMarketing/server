
// ADD shutdown LIST FUNCTIONALITY TO "process"
// ========================================================================================================

   // process status
   // -----------------------------------------------------------------
      process.status = 200;
   // -----------------------------------------------------------------

	// register shutdown function
	// -------------------------------------------------------------------------
		process.shutdown = function(sig, dfn)
		{
         var dte = new Date().to('Y-M-D h:m:s');
         var lst = process.shutdown.list;
         var rsn = '';
         var err = '';
         var log = '';

         for (var i in lst)
         { lst[i](dfn); }

         if ((typeof dfn == 'object') && (typeof dfn.stack == 'string'))
         {
            if (dfn.stack.indexOf('Error') > -1)
            { err = dfn.stack; }
         }

         if (sig != 'exit')
         { rsn = sig; }
         else if (dfn == 1)
         { rsn = 'FAILURE'; }
         else
         { rsn = 'CLEAN'; }

         log = 'EXIT: '+rsn;

         if((typeof cluster == 'object') && (cluster.isWorker))
         {
            err = null;
            log = null;
         }

         if (log)
         { stdout(log); }

         if (err)
         { stderr(err); }

         process.status = 410;

         process.exit();
			process.kill(process.pid);
		};
	// -------------------------------------------------------------------------

	// shutdown events to listen for
	// -------------------------------------------------------------------------
		process.shutdown.signals = // event listener list
		[
			'SIGHUP',
			'SIGINT',
			'SIGTERM',
         'SIGUSR1',
         'SIGUSR2',
			'exit',
			'uncaughtException'
		];
	// -------------------------------------------------------------------------

	// shutdown list
	// -------------------------------------------------------------------------
		process.shutdown.list = [];
	// -------------------------------------------------------------------------

	// add cleanup function to shutdown
	// -------------------------------------------------------------------------
		process.shutdown.add = function(fnc)
		{
			if (typeOf(fnc) == 'function')
			{ process.shutdown.list[process.shutdown.list.length] = fnc; }
		};
	// -------------------------------------------------------------------------

	// trigger shutdown function on any of these signal events
	// -------------------------------------------------------------------------
		process.shutdown.signals.forEach(function(v,i,a)
		{
			try
			{
				process.on(v, function(val)
				{
					if (process.status == 200)
					{ process.shutdown(v, val); }
				});
			}
			catch(err)
			{
            var dte = new Date().to('Y-M-D h:m:s');
            process.stderr.write(+'\n'+dte+'\n'+err.stack+'\n');
         }
		});
	// -------------------------------------------------------------------------

// ================================================================================================
