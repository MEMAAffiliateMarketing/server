
// JSAM INTEGRATION
// ========================================================================================================

   // strict mode :: standard
   // -----------------------------------------------------------------
      "use strict";
   // -----------------------------------------------------------------


   // node vm :: required
   // -----------------------------------------------------------------
      var vmNode = require('vm');
   // -----------------------------------------------------------------


   // global object :: register
   // -----------------------------------------------------------------
      global.JSAM = {};
   // -----------------------------------------------------------------


   // compilers :: register
   // -----------------------------------------------------------------
      JSAM.compiler = (function()
      {
         var tpe, cfg, rsl={};

         path.readdirSync('./ext/jsam/cmp').forEach(function(v,k,a)
         {
            tpe=null, cfg=null;
            v=v.split('.')[0];

            cfg = require('../ext/jsam/cfg/'+v+'.cfg.json');
            tpe = cfg[cfg.keys[0]];

            rsl[tpe] = {render:require('../ext/jsam/cmp/'+v+'.cmp.js'), config:cfg};

         });

         return rsl;
      }());
   // -----------------------------------------------------------------

// ========================================================================================================

//   JSAM.compiler['text/html'].render();

// JSAM :: PARSE
// ========================================================================================================
   JSAM.parse = function(dfn, ctx, inc)
   {
      if (typeOf(dfn) != 'string')
      {
         throw new TypeError('string expected');
         return;
      }

      dfn = dfn.minify();

      if (dfn.substr(0,2) != '({')
      {
         throw new ReferenceError('jsam :: invalid structure');
         return;
      }

      var tpe = dfn.extract('({', ':').split('"').join('').split("'").join('');

      if (typeOf(JSAM.compiler[tpe]) != 'object')
      {
         throw new ReferenceError('jsam :: no compiler for: "'+tpe.substr(0,40)+'"');
         return;
      }

      if (!inc)
      {
         if (!ctx)
         { ctx = {}; }

         for (var i in ctx)
         {
            if (!ctx['$'+i])
            {
               ctx['$'+i] = ctx[i];
               delete ctx[i];
            }
         }

         ctx.include = function(pth)
         {
            var ext, rsl;

            if (typeOf(pth) != 'string')
            { return 'string expected'; }

            if (pth.type != 'path')
            { return 'path expected'; }

            ext = path.extname(pth);

            if ((ext != '.jsam') && (ext != '.json'))
            { return 'jsam or json file type expected'; }

            if (!path.existsSync(pth))
            { return 'path does not exist'; }

            if (ext == '.json')
            {
               try
               { return require(pth); }
               catch(err)
               { return 'error in JSON file'; }
            }
            else
            {
               return JSAM.parse(path.readFileSync(pth, {encoding:'utf8'}), ctx, true).context;
            }
         };

         ctx.embed = function(obj)
         {
            if (typeOf(obj) != 'object')
            { return 'object expected'; }

            return {"_embed":obj};
         };
      }

      dfn = '_context='+dfn;

      var rsl = {};

      try
      {
         var tmp = vmNode.runInNewContext(dfn, ctx);

         rsl.context = tmp[tpe];
         rsl.compile = function(){ return JSAM.compiler[tpe].render(this.context); }
      }
      catch(err)
      {
         rsl.context = err;
         rsl.compile = function(){ return this.context.stack; }
      }

      return rsl;
   };
// ========================================================================================================

   var str = path.readFileSync('./src/doc/home.jsam', {encoding:'utf8'});
   var ctx = JSAM.parse(str, {name:'Simonne'});
   var rsl = JSAM.parse(str, {name:'Simonne'}).compile();

//   stdout(rsl);
