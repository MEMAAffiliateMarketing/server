
// SERVER & VHOSTS :: DEFINE
// ========================================================================================================

	// strict mode	:: standard
	// -----------------------------------------------------------------
		"use strict";
	// -----------------------------------------------------------------


	// register		:: Hyper Text Protocol service required
	// -----------------------------------------------------------------
		var htpSrv = require('http');
	// -----------------------------------------------------------------


	// register		:: querystring parser
	// -----------------------------------------------------------------
		var qryStr = require('querystring');
	// -----------------------------------------------------------------


	// register		:: domain  required
	// -----------------------------------------------------------------
		var domain = require('domain');
	// -----------------------------------------------------------------


	// register		:: create server object & assign config
	// -----------------------------------------------------------------
		var server = // object
		{
			conf: require('../cfg/server.json'),
			used:
			{
				address:{},
				tcpPort:{}
			}
		};
	// -----------------------------------------------------------------


	// register		:: create vHosts object
	// -----------------------------------------------------------------
		var vHosts = {};
	// -----------------------------------------------------------------


	// backup :: /etc/hosts
	// -----------------------------------------------------------------
		if (!path('../tmp/hosts').exists())
		{ path('/etc/hosts').copyTo('../tmp/hosts'); }
	// -----------------------------------------------------------------


	// restore :: /etc/hosts on shutdown
	// -----------------------------------------------------------------
		process.shutdown.add(function()
		{ path('../tmp/hosts').copyTo('/etc/hosts'); });
	// -----------------------------------------------------------------


	// listen :: for vhosts in dev mode
	// -----------------------------------------------------------------
		if (server.conf.srvMode == 'dev')
		{
         path(server.conf.hostDir).watch(function(evt, nme)
         {
            if (evt == 'rename')
            { server.update(); }
         });
		}
	// -----------------------------------------------------------------

	// register :: visitor handler
	// -----------------------------------------------------------------
		var visitor = function(hostName, request, response)
		{
			this.request =
			{
				method:request.method,
				protocol:request.protocol,
				hostName:request.headers.host,
				path:request.url.split('?')[0],
				variables:qryStr.parse(request.url.split('?')[1])
			};

			this.readPath = function()
			{};
		};
	// -----------------------------------------------------------------

// ========================================================================================================



// SERVER & VHOSTS :: ASSIGN
// ========================================================================================================

	// start :: start the server module
	// -----------------------------------------------------------------
		server.start = function()
		{
		// get server ip address
		// --------------------------------------------------------------
			server.getIPA(function(ipa)
			{
			// assign ip address to config
			// -----------------------------------------------------------
				server.conf.address = ipa;
			// -----------------------------------------------------------

			// update vHosts
			// -----------------------------------------------------------
				server.update();
			// -----------------------------------------------------------
			});
		};
	// -----------------------------------------------------------------


	// getIPA	:: get IP Address as defined in config
	// -----------------------------------------------------------------
		server.getIPA = function(cbf)
		{
		// get server mode
		// --------------------------------------------------------------
			var mode = server.conf.srvMode.www ? 'www' : 'dev';
			var bash = server.conf.ipDscvr[mode];
		// --------------------------------------------------------------


		// if ip address is assigned, use it
		// --------------------------------------------------------------
			if (server.conf.address !== 'auto')
			{
				cbf(server.conf.address);
				return;
			}
		// --------------------------------------------------------------


		// if ip address is auto, run bash cmd in cfg according to mode
		// --------------------------------------------------------------
			require('child_process').exec(bash, function(err, rsl)
			{
				if (err)
				{ throw err; }
				else
				{ cbf(rsl.trim()); }
			});
		};
	// -----------------------------------------------------------------


	// update	:: compare vHosts with hostDir & update accordingly
	// -----------------------------------------------------------------
		server.update = function()
		{
		// locals
		// --------------------------------------------------------------
			var dirLst = path(this.conf.hostDir).read().toObject();
			var etcHst = path('../tmp/hosts').read().trim()+'\n';
		// --------------------------------------------------------------

		// remove :: undefined vHosts
		// --------------------------------------------------------------
			for (var hst in vHosts)
			{
				if (!dirLst[hst])
				{ server.remove(hst); }
			}
		// --------------------------------------------------------------


		// create :: defined vHosts
		// --------------------------------------------------------------
			for (var nme in dirLst)
			{
				if (!vHosts[nme])
				{ server.create(nme); }
			}
		// --------------------------------------------------------------


		// update :: /etc/hosts after 10 mSec
		// --------------------------------------------------------------
			setTimeout(function()
			{
				for (var i in vHosts)
				{ etcHst += vHosts[i].conf.address+"\t"+i+" "+i; }

				path('/etc/hosts').write(etcHst+"\n");
			}, 10);
		// --------------------------------------------------------------
		};
	// -----------------------------------------------------------------


	// remove	:: remove vHost
	// -----------------------------------------------------------------
	   server.remove = function(nme)
	   {
	      if (vHosts[nme])
	      {
	         vHosts[nme].close();
				vHosts[nme].dispose();

	         delete vHosts[nme];

				server.update();

//	         process.send('shutdown');
	      }
	   };
	// -----------------------------------------------------------------


	// create	:: create vHost domain
	// -----------------------------------------------------------------
		server.create = function(nme)
		{
		// register locals
		// --------------------------------------------------------
			var srvCfg = server.conf;
			var hstPth = srvCfg.hostDir+'/'+nme;
			var htpHst = null;
			var vAutos = {};
		// --------------------------------------------------------


		// only create new domain if it is undefined
		// --------------------------------------------------------------
			if (vHosts[nme])
			{
				stderr(new ReferenceError('vHost conflict: "'+nme+'" not undefined'));
				return;
			}
		// --------------------------------------------------------------


		// if vHost folder is empty, populate it with template
		// -----------------------------------------------------------
			if (path(hstPth).read().length < 1)
			{
				path('../opt/vhost/').copyTo(hstPth+'/', function()
				{ stdout('domain "'+nme+'" created'); });
			}
		// -----------------------------------------------------------


		// create new domain
		// -----------------------------------------------------------
			vHosts[nme] = domain.create();
		// -----------------------------------------------------------


		// report errors, but don't crash
		// -----------------------------------------------------------
	      vHosts[nme].on('error', function(err)
	      { stderr(err); });
		// -----------------------------------------------------------


		// add vHost conf, use template if vHost has none
		// --------------------------------------------------------
			vHosts[nme].conf = (function()
			{
			// locals
			// -----------------------------------------------------
				var cfgPth = hstPth+'/cfg/host.json';
				var hstCfg = null;

				if (!path(cfgPth).exists)
				{ cfgPath = '../opt/vhost/cfg/host.json'; }

				hstCfg = require(cfgPth);
			// -----------------------------------------------------


			// hostName and rootpath
			// -----------------------------------------------------
				hstCfg.hstName = nme;
				hstCfg.rootPth = server.conf.hostDir+'/'+nme;
			// -----------------------------------------------------


			// if vHost cfg address is auto, assign server address
			// -----------------------------------------------------
				if (!hstCfg.address || (hstCfg.address == 'auto'))
				{
					hstCfg.address = server.conf.address;
					vAutos.address = true;
				}
			// -----------------------------------------------------


			// if vHost cfg tcpPort is auto, assign server tcpPort
			// -----------------------------------------------------
				if (!hstCfg.tcpPort || (hstCfg.tcpPort == 'auto'))
				{
					hstCfg.tcpPort = server.conf.tcpPort;
					vAutos.tcpPort = true;
				}
			// -----------------------------------------------------

			// dispatch
			// -----------------------------------------------------
				return hstCfg;
			// -----------------------------------------------------
			}());
		// --------------------------------------------------------


		// run vHost setup in new domain
		// -----------------------------------------------------------
			vHosts[nme].run(function()
			{
			// serve clients
			// --------------------------------------------------------
				vHosts[nme].serve = function(client)
				{

				};
			// --------------------------------------------------------

			// create http handler
			// --------------------------------------------------------
				vHosts[nme].handler = htpSrv.createServer(function(req, rsp)
				{
				// serve new client instance
				// -----------------------------------------------------
					vHosts[nme].serve(new request(req, rsp));
					return;
				// -----------------------------------------------------
				});
			// --------------------------------------------------------

			// listen on port and address assigned in this vHost's cfg
			// --------------------------------------------------------
				if
				(
					(!server.used.tcpPort[vHosts[nme].conf.tcpPort]) &&
					(!server.used.address[vHosts[nme].conf.address])
				)
				{
					server.used.tcpPort[vHosts[nme].conf.tcpPort] = 1;
					server.used.address[vHosts[nme].conf.address] = 1;

					vHosts[nme].handler.listen(vHosts[nme].conf.tcpPort, vHosts[nme].conf.address);
				}
			// --------------------------------------------------------

			});
		// -----------------------------------------------------------
		};
	// -----------------------------------------------------------------

// ========================================================================================================


// START :: SERVER & VHOSTS
// ========================================================================================================
	server.start();
// ========================================================================================================


// EXPORT SERVER
// ========================================================================================================
	module.exports = server;
// ========================================================================================================
