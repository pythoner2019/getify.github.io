/*! syntaxur
    v0.0.1-a (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/

(function UMD(name,context,definition) {
	if (typeof module != "undefined" && module.exports) module.exports = definition();
	else if (typeof define == "function" && define.amd) define(definition);
	else context[name] = definition();
})("Syntaxur",this,function definition(name,context) {

	function entityifyHTMLTagStart(code) {
		return code.replace(/</g,"&lt;");
	}

	function identifyOtherSegments(segments) {

		function split(code) {

			function saveText(text) {
				if (segs.length > 0 &&
					segs[segs.length-1].type === LIT.SEGMENT.GENERAL
				) {
					segs[segs.length-1].val += text;
				}
				// otherwise, just create a new one
				else {
					segs.push({
						type: LIT.SEGMENT.GENERAL,
						val: text
					});
				}
			}

			var segs = [], unmatched, left_context,
				next_match_idx = 0, prev_match_idx = 0
			;
			
			while (next_match_idx < code.length) {
				unmatched = "";

				pattern.lastIndex = next_match_idx;
				match = pattern.exec(code);

				if (match) {
					prev_match_idx = next_match_idx;
					next_match_idx = pattern.lastIndex;

					// collect the previous string code not matched before this segment
					if (prev_match_idx < next_match_idx - match[0].length) {
						unmatched = code.slice(prev_match_idx,next_match_idx - match[0].length);
					}
				}
				else {
					prev_match_idx = next_match_idx;
					next_match_idx = code.length;
					unmatched = code.slice(prev_match_idx);
					if (!unmatched) break;
				}

				if (unmatched) {
					saveText(unmatched);
				}

				if (match) {
					left_context = code.slice(0,next_match_idx - match[0].length);

					if (
						match[0].match(/true|false|null|Infinity|NaN|undefined/) &&
						!left_context.match(/\.$/)
					) {
						segs.push({
							type: SEGMENT_SIMPLE_LITERAL,
							val: match[0]
						});
					}
					else if (
						match[0].match(/function|return|var|let|const|for|while|do|if|else|try|catch|finally|throw|break|continue|switch|case|default|delete|debugger|in|instanceof|new|this|typeof|void|with|class|export|import|extends|super|yield/) &&
						!left_context.match(/\.$/)
					) {
						segs.push({
							type: SEGMENT_KEYWORD,
							val: match[0]
						});
					}
					else if (match[0].match(/[`~!%&*()\-+=[\]{};:<>,.\/?\\|]/)) {
						segs.push({
							type: SEGMENT_OPERATOR,
							val: match[0]
						});
					}
					else {
						saveText(match[0]);
					}
				}
			}

			return segs;
		}

		var i, seg, segs,
			pattern = /\b(?:true|false|null|Infinity|NaN|undefined|function|return|var|let|const|for|while|do|if|else|try|catch|finally|throw|break|continue|switch|case|default|delete|debugger|in|instanceof|new|this|typeof|void|with|class|export|import|extends|super|yield)\b|[`~!%&*()\-+=[\]{};:<>,.\/?\\|]/g
		;

		for (i=0; i<segments.length; i++) {
			if (segments[i].type === LIT.SEGMENT.GENERAL) {
				seg = segments[i];

				segs = split(seg.val);
				if (segs.length > 0) {
					segs.unshift(i,1); // add splice arguments onto front of array
					segments.splice.apply(segments,segs);
					i += segs.length - 2;
				}
			}
		}
	}

	function highlight(code) {
		var segments, i, ret = "";

		// identify the complex literals first!
		segments = LIT.lex(code);

		// lex out the other segments types we want to highlight
		identifyOtherSegments(segments);

		// process all the segments and annotate them with styles
		for (i=0; i<segments.length; i++) {
			if (segments[i].type === LIT.SEGMENT.GENERAL) {
				ret += entityifyHTMLTagStart(segments[i].val);
			}
			else if (segments[i].type === SEGMENT_SIMPLE_LITERAL) {
				ret += "<span style=\"" + (public_api.options.simple || default_opts.simple) + "\">";
				ret += segments[i].val;
				ret += "</span>";
			}
			else if (segments[i].type === SEGMENT_KEYWORD) {
				ret += "<span style=\"" + (public_api.options.keyword || default_opts.keyword) + "\">";
				ret += segments[i].val;
				ret += "</span>";
			}
			else if (segments[i].type === SEGMENT_OPERATOR) {
				ret += "<span style=\"" + (public_api.options.operator || default_opts.operator) + "\">";
				ret += entityifyHTMLTagStart(segments[i].val);
				ret += "</span>";
			}
			else if (segments[i].type === LIT.SEGMENT.COMMENT) {
				ret += "<span style=\"" + (public_api.options.comment || default_opts.comment) + "\">";
				ret += entityifyHTMLTagStart(segments[i].val);
				ret += "</span>";
			}
			else if (segments[i].type === LIT.SEGMENT.STRING_LITERAL) {
				ret += "<span style=\"" + (public_api.options.string || default_opts.string) + "\">";
				ret += entityifyHTMLTagStart(segments[i].val);
				ret += "</span>";
			}
			else if (segments[i].type === LIT.SEGMENT.BACKTICK_LITERAL) {
				ret += "<span style=\"" + (public_api.options.backtick || default_opts.backtick) + "\">";
				ret += entityifyHTMLTagStart(segments[i].val);
				ret += "</span>";
			}
			else if (segments[i].type === LIT.SEGMENT.REGEX_LITERAL) {
				ret += "<span style=\"" + (public_api.options.regex || default_opts.regex) + "\">";
				ret += entityifyHTMLTagStart(segments[i].val);
				ret += "</span>";
			}
			else if (segments[i].type === LIT.SEGMENT.NUMBER_LITERAL) {
				ret += "<span style=\"" + (public_api.options.number || default_opts.number) + "\">";
				ret += segments[i].val;
				ret += "</span>";
			}
		}

		return ret;
	}


	var
		SEGMENT_SIMPLE_LITERAL = 100,
		SEGMENT_KEYWORD = 101,
		SEGMENT_OPERATOR = 102,

		default_opts = {
			comment: "color:#999;font-style:italic;",
			string: "color:#909;background-color:#eee;",
			backtick: "color:#039;background-color:#39f;",
			regex: "color:#090;font-weight:bold;",
			number: "color:#900;font-weight:bold;",
			simple: "color:#009;font-style:italic;",
			keyword: "color:#660;font-weight:bold;",
			operator: "color:#0aa;font-weight:bold;"
		},

		public_api = {
			options: JSON.parse(JSON.stringify(default_opts)),
			highlight: highlight
		}
	;

	return public_api;
});