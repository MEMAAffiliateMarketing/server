
// STRICT MODE
// ================================================================================================
   "use strict";
// ================================================================================================


// EXTENDS :: PROTOTYPES - make non-writable non-enumerable, and non-configurable
// ========================================================================================================
   global.extend = function(src)
   {
      var opt = {writeable:false, enumerable:false, configurable:false};
      var rsl = {};

      rsl.pty = function(nme, fnc)
      {
         opt.get = fnc;
         Object.defineProperty(src, nme, opt);
      };

      rsl.fnc = function(nme, fnc)
      {
         opt.value = fnc;
         Object.defineProperty(src, nme, opt);
      };

      return rsl;
   };
// ========================================================================================================


// IDENTIFIES A VARIABLE
// ========================================================================================================
   global.typeOf = function(dfn)
   {
      var tpe = (typeof arg).toLowerCase();

      if (tpe === 'number')
      {
         if (isNaN(dfn))
         { tpe = 'nan'; }

         if ((dfn+'').indexOf('.') > -1)
         { tpe = 'float'; }
      }
      else
      { tpe = ({}).toString.call(dfn).match(/\s([a-zA-Z]+)/)[1].toLowerCase(); }

      return tpe;
   };
// ========================================================================================================


// EXTENDS STRING :: ADDS "type"
// ========================================================================================================
   extend(String.prototype).pty('type', function()
   {
      var dfn = this.toString();
      var rgx = null;

      // empty
      // --------------------------------------------------------------
         if (dfn.length < 1)
         { return 'empty'; }
      // --------------------------------------------------------------

      // whitespace
      // --------------------------------------------------------------
         if (dfn.match(/^\s*$/gi))
         { return 'whitespace'; }
      // --------------------------------------------------------------

      // boolean
      // --------------------------------------------------------------
         if ((dfn === 'true') || (dfn === 'false'))
         { return 'boolean'; }
      // --------------------------------------------------------------

      // char
      // --------------------------------------------------------------
         rgx = /^[a-zA-Z]{1,1}$/;

         if (rgx.test(dfn))
         { return 'char'; }
      // --------------------------------------------------------------

      // word
      // --------------------------------------------------------------
         rgx = /^[a-zA-Z]{2,30}$/;

         if (rgx.test(dfn))
         { return 'word'; }
      // --------------------------------------------------------------

      // number
      // --------------------------------------------------------------
         rgx = /^[0-9]{1,32}$/;

         if ((rgx.test(dfn)) && ((dfn.match(/\-/g)||[]).length < 2))
         {
            if ((dfn.indexOf('-') < 0) || (dfn.indexOf('-') === 0))
            { return 'number'; }
         }
      // --------------------------------------------------------------

      // float
      // --------------------------------------------------------------
         rgx = /^[0-9\-\.]{1,64}$/;

         if (rgx.test(dfn) && (dfn.indexOf('.') > 0) && ((dfn.match(/\-/g)||[]).length < 2))
         {
            if ((dfn.indexOf('-') < 0) || (dfn.indexOf('-') === 0))
            { return 'float'; }
         }
      // --------------------------------------------------------------

      // path
      // --------------------------------------------------------------
         rgx = /^[a-zA-Z0-9\-_\./]+$/;

         if ((dfn.length > 3) && (dfn.length < 512) && (rgx.test(dfn)))
         {
            if(dfn.indexOf('.') > -1)
            {
               var ext = dfn.split('.');
               ext = ext[ext.length -1];

               if ((ext.length > 0) && (ext.length < 5))
               { return 'path'; }
            }
            else
            { return 'path'; }
         }
      // --------------------------------------------------------------

      // url
      // --------------------------------------------------------------
         rgx = /(http|ftp|https|ws|wss):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;

         if (rgx.test(dfn))
         { return 'url'; }
      // --------------------------------------------------------------

      // email
      // --------------------------------------------------------------
         rgx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

         if (rgx.test(dfn))
         { return 'email'; }
      // --------------------------------------------------------------

      // array
      // --------------------------------------------------------------
         if ((dfn.substr(0,1) === '[') && (dfn.substr((dfn.length -1),1) === ']'))
         {
            try
            {
               var tst = JSON.parse(dfn);
               tst = tst.pop();

               if (tst)
               { return 'array'; }
            }
            catch(e)
            { e=null; }
         }
      // --------------------------------------------------------------

      // json
      // --------------------------------------------------------------
         if ((dfn.substr(0,1) === '{') && (dfn.substr((dfn.length -1),1) === '}'))
         {
            try
            {
               var tst = JSON.parse(dfn);

               if (typeOf(tst) == 'json')
               { return 'json'; }
            }
            catch(e)
            { e=null; }
         }
      // --------------------------------------------------------------

      // undefined
      // --------------------------------------------------------------
         return 'undefined';
      // --------------------------------------------------------------
   });
// ========================================================================================================


// EXTENDS STRING :: ADDS "extract"
// ========================================================================================================
   extend(String.prototype).fnc('extract', function(b,e)
   {
      var dfn = this.toString();

      var rsl = null;
      var pts = dfn.split(b);

      if (pts.length > 1)
      { rsl = pts[1].split(e)[0]; }

      return rsl;
   });
// ========================================================================================================


// EXTENDS STRING :: ADDS "extract"
// ========================================================================================================
   extend(String.prototype).fnc('deliminate', function(s,r)
   {
      var dfn = this.toString();

      if (s == 'camelCase')
      {
         var ucl = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

         for (var i in ucl)
         {
            if (dfn.indexOf(ucl[i]) > -1)
            { dfn = dfn.split(ucl[i]).join(r+ucl[i].toLowerCase()); }
         }
      }

      return dfn;
   });
// ========================================================================================================


// EXTENDS STRING :: ADDS "minify"
// ========================================================================================================
   extend(String.prototype).fnc('minify', function()
   {
      var dfn = this.toString();
      var pts = dfn.split("\n");

      for (var l in pts)
      { pts[l] = pts[l].trim(); }

      dfn = pts.join("\n");

      var cmt = {lne:{bgn:'//', end:"\n"}, doc:{bgn:'/*', end:'*/'}}
      var chr = dfn.split('');

      var cmtOn = false;
      var strOn = false;

      var pair = '';
      var ctpe = 0;
      var spce = 0;
      var rslt = '';

      var lft = '({[:';
      var rgt = ':]})';

      for (var i=0; i<chr.length; i++)
      {
         if ((chr[i] == "'") || (chr[i] == '"'))
         {
            if (strOn == false)
            { strOn = true; }
            else
            { strOn = false; }

         }

         var pair = chr[i]+chr[i+1];

         if (pair == cmt.lne.bgn)
         {
            if (strOn == false)
            {
               cmtOn = true;
               ctpe = 'lne';
            }
         }

         if (pair == cmt.doc.bgn)
         {
            if (strOn == false)
            {
               cmtOn = true;
               ctpe = 'doc';
            }
         }

         if (chr[i] == cmt.lne.end)
         {
            if ((strOn == false) && (ctpe == 'lne'))
            { cmtOn = false; }
         }

         if (pair == cmt.doc.end)
         {
            if ((strOn == false) && (ctpe == 'doc'))
            { cmtOn = false; i+=2; }
         }

         if (cmtOn == false)
         {
            if (chr[i] == ' ')
            { spce++; }
            else
            { spce = 0; }

            if (strOn == false)
            {
               if (spce < 2)
               {
                  if ((chr[i] != "\t") && (chr[i] != "\n"))
                  {
                     if (chr[i] == ' ')
                     {
                        if ((lft.indexOf(chr[i-1]) < 0) && (lft.indexOf(chr[i+1]) < 0))
                        { rslt += chr[i]; }
                     }
                     else
                     { rslt += chr[i]; }
                  }
               }
            }
            else
            { rslt += chr[i]; }
         }
      }

      return rslt;
   });
// ========================================================================================================


// EXTENDS OBJECT :: ADDS "keys"
// ========================================================================================================
   extend(Object.prototype).pty('keys', function()
   {
      var dfn = this;
      var rsl = [];

      for (var i in dfn)
      {
         rsl[rsl.length] = i;
      }

      return rsl;
   });
// ========================================================================================================


// EXTENDS DATE :: ADDS "to"
// ========================================================================================================
   extend(Date.prototype).fnc('to', function(dfn)
   {
      var dte = this;

      if (dfn === 'GMT')
      { return dte.toGMTString(); }
      else
      {
         var obj = {
            Y : dte.getFullYear(),
            M : (dte.getMonth() +1),
            D : dte.getDate(),
            h : dte.getHours(),
            m : dte.getMinutes(),
            s : dte.getSeconds()
         };

         for (var i in obj)
         { dfn = dfn.split(i).join((obj[i]<=9 ? '0' + obj[i] : obj[i])+''); }

         return dfn;
      }
   });
// ========================================================================================================


// EXTENDS ARRAY :: ADDS "toObject"
// ========================================================================================================
   extend(Array.prototype).fnc('toObject', function()
   {
      var dfn = this;
      var rsl = {};

      dfn.forEach(function(i,k,a)
      { rsl[i] = k; });

      return rsl;
   });
// ========================================================================================================
