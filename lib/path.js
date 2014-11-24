
// REQUIRED
// ================================================================================================
	var flSys = require('fs');
	var child = require('child_process');
// ================================================================================================


// PATH :: GLOBAL
// ================================================================================================
	global.path = function(pth)
	{
	// REGISTER
	// ---------------------------------------------------------------------------------------------
		var mod = {};
	// ---------------------------------------------------------------------------------------------

	// VALIDATE
	// ---------------------------------------------------------------------------------------------
		if (pth.type !== 'path')
		{
			throw new TypeError('path expected');
			return;
		}
	// ---------------------------------------------------------------------------------------------

	// ASSEMBLE
	// ---------------------------------------------------------------------------------------------

		// properties
		// ------------------------------------------------------------------------------------------
			mod.rootDir	 = (function()
			{
				if (pth[0] !== '/')
				{ return null; }

				var rsl = pth.split('/');
				return '/'+rsl[1];
			}());

			mod.baseName = pth.split('/').pop();
			mod.extName  = mod.baseName.split('.')[1];

			mod.dirName	 = (function(bnm)
			{
				var rsl = pth.split('/'+bnm);

				if (rsl.length > 1)
				{ return rsl[0]; }

				return null;
			}(mod.baseName));
/*
			mod.mimeType = (function()
			{
				if (typeOf(path.mime[mod.extName]) == 'object')
				{ return path.mime[mod.extName].tpe; }
				else
				{ return; }
			}());
*/
		// ------------------------------------------------------------------------------------------

		// methods
		// ------------------------------------------------------------------------------------------

			// prepend root path for absolute path operations
			// ---------------------------------------------------------------------------------------
				if ((pth[0] !== '/') && (pth[0] !== '.'))
				{ pth = process.cwd()+'/'+pth; }
			// ---------------------------------------------------------------------------------------

			// exists
			// ---------------------------------------------------------------------------------------
				mod.exists = function(cbf)
				{
					if (typeOf(cbf) == 'function')
					{
						flSys.exists(pth, function(bln)
						{ cbf(bln); });
					}
					else
					{ return flSys.existsSync(pth); }
				};
			// ---------------------------------------------------------------------------------------

			// create
			// ---------------------------------------------------------------------------------------
				mod.create = function(opt, cbf)
				{
					if (typeOf(opt) != 'object')
					{ opt = {encoding:'utf8', mode:438}; }

					opt.flag = 'w';

					if (typeOf(cbf) != 'function')
					{
						if (fileSys.existsSync(pth))
						{ throw new Error(409); }

						return fileSys.writeFileSync(pth, '', opt)
					}
					else
					{
						fileSys.exists(pth, function(bool)
						{
							if (bool === true)
							{ cbf(false, 409); }
							else
							{
								fileSys.writeFile(pth, '', opt, function(err)
								{
									if (err)
									{ cbf(false, 403); }
									else
									{ cbf(true, 200); }
								});
							}
						});
					}
				};
			// ---------------------------------------------------------------------------------------

			// watch
			// ---------------------------------------------------------------------------------------
				mod.watch = function(cbf)
				{
					if (typeOf(cbf) != 'function')
					{
						throw new Error(405);
						return;
					}

					flSys.exists(pth, function(bln)
					{
						if (!bln)
						{
							throw new Error(404);
							return;
						}

						flSys.watch(pth, {persistent:true}, cbf);
					});
				};
			// ---------------------------------------------------------------------------------------

			// typeOf
			// ---------------------------------------------------------------------------------------
				mod.typeOf = function(dfn, cbf)
				{
					if (typeOf(dfn) != 'string')
					{
						throw new TypeError('string expected');
						return;
					}

					var assertType = function(dfn, inf)
					{
						var opt = /* object: stat info shorthand options */
						{
							File				: {fle:1, file:1},
							FIFO				: {ffo:1, fifo:1},
							Socket			: {sck:1, socket:1},
							Directory		: {dir:1, folder:1, directory:1},
							BlockDevice		: {blk:1, blkDev:1, blockDevice:1},
							CharacterDevice: {chr:1, chrDev:1, characterDevice:1},
							SymbolicLink	: {sym:1, symLnk:1, symLink:1, symbolicLink:1}
						};

						for (var i in opt)
						{
							if (inf['is'+i]())
							{
								if (opt[i][dfn] == 1)
								{ return true; }
							}
						}

						return false;
					};

					if (typeOf(cbf) != 'function')
					{
						if (!flSys.existsSync(pth))
						{
							throw new Error(404);
							return;
						}

						var inf = flSys.statSync(pth);

						return assertType(dfn, inf);
					}
					else
					{
						flSys.exists(pth, function(bln)
						{
							if (!bln)
							{ cbf(404, null); }
							else
							{
								flSys.stat(pth, function(err, inf)
								{
									if (err)
									{ cbf(403, null); }
									else
									{ cbf(null, assertType(dfn, inf)); }
								});
							}
						});
					}
				};
			// ---------------------------------------------------------------------------------------

			// watch
			// ---------------------------------------------------------------------------------------
				mod.getType = function(cbf)
				{
					if (typeOf(cbf) != 'function')
					{
						throw new Error(405);
						return;
					}

					flSys.exists(pth, function(bln)
					{
						if (!bln)
						{ cbf(404, null); }
						else
						{
							flSys.stat(pth, function(err, inf)
							{
								if (err)
								{ cbf(403, null); }
								else
								{
									var opt = /* object: stat info shorthand options */
									{
										File				: 'file',
										FIFO				: 'fifo',
										Socket			: 'socket',
										Directory		: 'folder',
										BlockDevice		: 'blkDev',
										CharacterDevice: 'chrDev',
										SymbolicLink	: 'symLink'
									};

									for (var i in opt)
									{
										if (inf['is'+i]())
										{
											cbf(null, opt[i]);
											break;
										}
									}
								}
							});
						}
					});
				};
			// ---------------------------------------------------------------------------------------

			// getSize
			// ---------------------------------------------------------------------------------------
				mod.getSize = function(cbf)
				{
					if (typeOf(cbf) != 'function')
					{
						if (!flSys.existsSync(pth))
						{
							throw new Error(404);
							return;
						}

						return (flSys.statSync(pth).size / 1024);
					}
					else
					{
						flSys.exists(pth, function(bln)
						{
							if (!bln)
							{ cbf(404, null); }
							else
							{
								flSys.stat(pth, function(err, inf)
								{
									if (err)
									{ cbf(403, null); }
									else
									{ cbf(null, (inf.size / 1024)); }
								});
							}
						});
					}
				};
			// ---------------------------------------------------------------------------------------

			// read
			// ---------------------------------------------------------------------------------------
				mod.read = function(opt, cbf)
				{
					if (typeOf(opt) == 'function')
					{
						cbf = opt;
						opt = {encoding:'utf8'};
					}

					if (!opt)
					{ opt = {encoding:'utf8'}; }
					else
					{
						if (opt == 'buffer')
						{ opt = null; }
						else
						{ opt = {encoding:opt}; }
					}

					if (typeOf(cbf) != 'function')
					{
						if (!flSys.existsSync(pth))
						{
							throw new Error(404+' "'+pth+'" Not Found');
							return;
						}

						var inf = flSys.statSync(pth);

						if (inf.isFile())
						{ return flSys.readFileSync(pth, opt); }

						if (inf.isDirectory())
						{ return flSys.readdirSync(pth); }
					}
					else
					{
						flSys.exists(pth, function(bool)
						{
							if (bool !== true)
							{ cbf(404, null); }
							else
							{
								flSys.stat(pth, function(err, inf)
								{
									if (inf.isFile())
									{
										flSys.readFile(pth, opt, function(err, rsl)
										{
											if (err)
											{ cbf(403, null); }
											else
											{ cbf(null, rsl); }
										});
									}
									else if (inf.isDirectory())
									{
										flSys.readdir(pth, opt, function(err, rsl)
										{
											if (err)
											{ cbf(403, null); }
											else
											{ cbf(null, rsl); }
										});
									}
								});
							}
						});
					}
				};
			// ---------------------------------------------------------------------------------------

			// write
			// ---------------------------------------------------------------------------------------
				mod.write = function(val, opt, cbf)
				{
					if (typeOf(opt) == 'function')
					{
						cbf = opt;
						opt = {encoding:'utf8', mode:438, flag:'w'};
					}

					if (typeOf(opt) != 'object')
					{ opt = {encoding:'utf8', mode:438, flag:'w'}; }

					if (typeOf(val) == 'object')
					{ val = JSON.stringify(val, null, 4); }

					if (typeOf(cbf) != 'function')
					{
						if (!flSys.existsSync(pth))
						{ throw new Error(404); }

						return flSys.writeFileSync(pth, val, opt);
					}
					else
					{
						flSys.exists(pth, function(bool)
						{
							if (bool !== true)
							{ cbf(false, 404); }
							else
							{
								flSys.writeFile(pth, val, opt, function(err)
								{
									if (err)
									{ cbf(false, 403); }
									else
									{ cbf(true, 200); }
								});
							}
						});
					}
				};
			// ---------------------------------------------------------------------------------------

			// copyTo
			// ---------------------------------------------------------------------------------------
				mod.copyTo = function(dst, cbf)
				{
					if ((typeOf(dst) != 'string') || (dst.type != 'path'))
					{
						throw new TypeError('path expected');
						return;
					}

					if ((dst[0] !== '/') && (dst[0] !== '.'))
					{ dst = process.cwd()+'/'+dst; }

					var cmd = 'rsync -a '+pth+' '+dst;

					if (typeOf(cbf) != 'function')
					{
						if (!flSys.existsSync(pth))
						{
							throw new Error(404);
							return;
						}

						var tmp = flSys.readFileSync(pth, {encoding:'utf8'});

						flSys.writeFileSync(dst, tmp, {encoding:'utf8', mode:438, flag:'w'});

						tmp = null;
						return true;
					}
					else
					{
						flSys.exists(pth, function(bln)
						{
							if (bln !== true)
							{ cbf(false, 404); }
							else
							{ child.exec(cmd, cbf); }
						});
					}
				}
			// ---------------------------------------------------------------------------------------

		// ------------------------------------------------------------------------------------------

	// ---------------------------------------------------------------------------------------------

	// DISPATCH
	// ---------------------------------------------------------------------------------------------
		return mod;
	// ---------------------------------------------------------------------------------------------
	};
// ================================================================================================
