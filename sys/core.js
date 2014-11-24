
// CORE INIT :: master && worker
// ========================================================================================================

   // strict mode
   // -------------------------------------------------------------------------
      "use strict";
   // -------------------------------------------------------------------------

   // set cwd
   // -------------------------------------------------------------------------
      process.chdir(__dirname);
   // -------------------------------------------------------------------------

   // tools lib
   // -------------------------------------------------------------------------
      require('../lib/proto.js');
   // -------------------------------------------------------------------------

   // path :: global
   // -------------------------------------------------------------------------
      require('../lib/path.js');
   // -------------------------------------------------------------------------

   // jsam :: global
   // -------------------------------------------------------------------------
   	require('../mod/jsam/index.js');
   // -------------------------------------------------------------------------

   // system log global
   // -------------------------------------------------------------------------
      require('./stdlog.js');
   // -------------------------------------------------------------------------

   // for process shutdown
   // -------------------------------------------------------------------------
      require('./shutdown.js');
   // -------------------------------------------------------------------------

   // cluster mod
   // -------------------------------------------------------------------------
      var cluster = require('cluster');
   // -------------------------------------------------------------------------

// ========================================================================================================



// CORE :: master
// ========================================================================================================
   if (cluster.isMaster)
   {
   // register local vars
   // -------------------------------------------------------------------------
      var conf = require('../cfg/core.json');
      var prcs = (require('os').cpus().length * conf.procPerCPU);
      var used = 0;
      var left = prcs;
      var avlp = null;
   // -------------------------------------------------------------------------


   // assign core globally
   // -------------------------------------------------------------------------
      global.core = {};
   // -------------------------------------------------------------------------


   // reveal system mode globally
   // -------------------------------------------------------------------------
      global.sysMode = conf.systemMode;
   // -------------------------------------------------------------------------


   // log system startup
   // -------------------------------------------------------------------------
      stdout('BOOT: '+sysMode+' mode');
   // -------------------------------------------------------------------------


   // refresh cores
   // -------------------------------------------------------------------------
      extend(core).fnc('refresh', function(mod)
      {
         stdout('TODO: build refresh cores that handle:'+mod);
      });
   // -------------------------------------------------------------------------


   // require once :: master process only
   // -------------------------------------------------------------------------
      conf.reqOnceLst.forEach(function(pth)
      {
         require(pth);
      });
   // -------------------------------------------------------------------------


   // cluster master options
   // -------------------------------------------------------------------------
      cluster.setupMaster
      ({
         exec  : __filename,
         args  : [1],
         silent: false
      });
   // -------------------------------------------------------------------------


   // set up a core for number of available processes
   // -------------------------------------------------------------------------
      for (var i=1; i <= prcs; i++)
      {
         core[i]=
         {
         // worker properties
         // -------------------------------------------------------------------
            number : i,
            modNme : null,
            entity : null,
            status : 200,
         // -------------------------------------------------------------------

         // worker methods
         // -------------------------------------------------------------------
            commit : function(mod)
            {
               this.modNme = mod;

               stdout('core['+this.number+'] ~ '+mod);
            }
         // -------------------------------------------------------------------
         };
      }
   // -------------------------------------------------------------------------


   // assign cores :: numerical
   // -------------------------------------------------------------------------
      for (var i in conf.distribute)
      {
         var asgnCpus = conf.distribute[i];

         if (typeOf(asgnCpus) == 'number')
         {
            for (var a=0; a < asgnCpus; a++)
            {
               used++;

               if (used <= prcs)
               {
                  core[used].commit(i);
                  left--;
               }
               else
               { stdout('assigning "'+i+'" failed :: max procPerCPU exceeded'); }
            }
         }
         else
         {
            if (asgnCpus == 'avl')
            { avlp = i; }
         }
      }
   // -------------------------------------------------------------------------

   // assign cores :: available
   // -------------------------------------------------------------------------
      if (avlp != null)
      {
         if (left > 0)
         {
            for (var a=0; a < left; a++)
            {
               if (used <= prcs)
               {
                  used++;
                  core[used].commit(avlp);
               }
            }
         }
         else
         { stdout('assigning "'+avlp+'" failed :: max procPerCPU exceeded'); }
      }
   // -------------------------------------------------------------------------
   }
// ========================================================================================================