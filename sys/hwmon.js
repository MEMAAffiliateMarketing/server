
// STRICT MODE
// ================================================================================================
   "use strict";
// ================================================================================================


// CHILD PROCESS
// ================================================================================================
   var child = require('child_process');
// ================================================================================================


// OBJECT
// ================================================================================================
   var hwMon = {conf:require('../cfg/hwmon.json'), stats:{HDD:0, RAM:0, CPU:0}};
// ================================================================================================


// FUNCTIONS
// ================================================================================================

   // getUsage :: get resource usage info
   // ---------------------------------------------------------------------------------------------
      hwMon.check = function(key, cbf)
      {
      // REGISTER
      // ------------------------------------------------------------------------------------------
         var pth=null, fnc={};
      // ------------------------------------------------------------------------------------------

      // ASSEMBLE
      // ------------------------------------------------------------------------------------------

         // custom file system target
         // ---------------------------------------------------------------------------------------
            if (key.indexOf(':/') > 0)
            {
               var tmp = key.split(':');
               key = tmp[0];
               pth = tmp[1];
            }
         // ---------------------------------------------------------------------------------------

         // HDD :: disk usage
         // ---------------------------------------------------------------------------------------
            fnc.HDD = function(pth, opt)
            {
               if (pth === null)
               { pth = process.cwd(); }

               var cmd = 'df -k --output=used,avail '+pth+' | tail -1';

               child.exec(cmd, function(err, rsp)
               {
                  rsp = rsp.split(' ');
                  rsp = [parseInt(rsp[0]), parseInt(rsp[1])];

                  cbf(rsp, 'HDD');
               }, (hwMon.conf.usage.checkUsageSec *1000));
            };
         // ---------------------------------------------------------------------------------------

         // RAM :: memory usage
         // ---------------------------------------------------------------------------------------
            fnc.RAM = function()
            {
               var cmd = 'vmstat -s';

               child.exec(cmd, function(err, rsp)
               {
                  rsp = rsp.split("\n");
                  rsp = [parseInt(rsp[2]), parseInt(rsp[0])]

                  cbf(rsp, 'RAM');
               }, (hwMon.conf.usage.checkUsageSec *1000));
            };
         // ---------------------------------------------------------------------------------------

         // CPU :: proccessor usage
         // ---------------------------------------------------------------------------------------
            fnc.CPU = function()
            {
               var cmd = 'top -bn 2| grep Cpu | gawk \'{print $2+$4+$6}\' | tail -1';

               child.exec(cmd, function(err, rsp)
               {
                  rsp = [parseFloat(rsp), 100];

                  cbf(rsp, 'CPU');
               }, (hwMon.conf.usage.checkUsageSec *1000));
            };
         // ---------------------------------------------------------------------------------------

      // ------------------------------------------------------------------------------------------

      // VALIDATE
      // ------------------------------------------------------------------------------------------
         if (typeOf(key) !== 'string')
         { throw new TypeError(400); }

         if (typeOf(cbf) !== 'function')
         { throw new ReferenceError(400); }

         if (typeOf(fnc[key]) != 'function')
         { throw new ReferenceError(501); }
      // ------------------------------------------------------------------------------------------

      // DISPATCH
      // ------------------------------------------------------------------------------------------
         fnc[key](pth);
      // ------------------------------------------------------------------------------------------
      };
   // ---------------------------------------------------------------------------------------------

   // check usage on interval, if over limit, write suicide note and die
   // ---------------------------------------------------------------------------------------------
      hwMon.init = function()
      {
         var usgCfg = hwMon.conf.usage;
         var ftgSec = 0;

         var chkItv = setInterval(function()
         {
            var lst = ['CPU', 'RAM', 'HDD'];

            for (var i in lst)
            {
               hwMon.check(lst[i], function(val, key)
               {
                  var curPrc = Math.ceil((val[0] / val[1]) *100);
                  var maxPrc = usgCfg['max'+key+'Percent'];
                  var sysErr = false;

                  if (key == 'CPU')
                  {
                     if (curPrc > maxPrc)
                     { ftgSec += usgCfg.checkUsageSec; }
                     else
                     {
                        if (!(ftgSec < usgCfg.checkUsageSec))
                        { ftgSec -= usgCfg.checkUsageSec; }
                     }

                     if (ftgSec >= usgCfg.CPUfatigueSec)
                     { sysErr = key+' ran above '+maxPrc+'% for '+usgCfg.CPUfatigueSec+'sec'; }
                  }
                  else
                  {
                     if (curPrc > maxPrc)
                     { sysErr = key+' usage is above '+maxPrc+'%'; }
                  }

                  if (sysErr)
                  {
                     clearInterval(sysItv);

                     sysErr = new Error(sysErr);
                     sysErr.name = 'OverloadError';

                     stdout(sysErr);
                     throw sysErr;

                     setTimeout(function()
                     {
                        process.exit('SIGKILL');
                     },1);
                  }
                  else
                  {
                     hwMon.stats[key] = curPrc+'%';
                  }
               });
            }

         }, (usgCfg.checkUsageSec *1000));
      };
   // ---------------------------------------------------------------------------------------------

// ================================================================================================


// EXPORT HARDWARE MONITOR
// ================================================================================================
   hwMon.init();
   //module.exports = hwMon;
// ================================================================================================
