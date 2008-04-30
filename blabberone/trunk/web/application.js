function registerResponders() {
  Ajax.Responders.register({
    onCreate: function() {
      $('loader').show();
    },
    onComplete: function() {
      $('loader').hide();
    }
  });
}

function favour(status_id) {
  new Ajax.Request('/favourings/create/' + status_id, { 
    asynchronous: true, 
    evalScripts: true 
  });
  
  return false;
}

function replyTo(screen_name) {  
  if ($('status')) {    
    $('status').value = $('status').value.gsub(/\s?@\w+\s?/, '');
    oldValue = $('status').getValue();
    $('status').focus();
	  var text = $('status').value = "@" + screen_name + " " + oldValue;
	  $('status').scrollTo();
	  updateStatusTextCharCounter($('status').value);	
  }
  return;
}

function follow(user_id, screen_name) {
	new Ajax.Request('/friendships/create/' + user_id, {
	  asynchronous: true, 
	  evalScripts: true,
	  onComplete: function(transport) {
      if (transport.responseText.match(/Bring/)) { /* check for bring that beat back first */
        borked();
      } else if (transport.responseText.match(/success/)) { /* success */
        refresh_follow_control(user_id, 'followed');
      } else {  /* error */
        borked();
      }
    }
	});
	return;
}

function follow_or_remove_multiple_from_string(user_ids, follow) {
  url = follow ? '/friendships/cmfs' : '/friendships/dmfs';
  new Ajax.Request(url, {
    method: 'post',
    parameters: { user_ids: user_ids },
    asynchronous: true,
    evalScripts: true
  });
	return;
}

function removeUser(user_id, screen_name) {
  new Ajax.Request('/friendships/destroy/' + user_id, {
    asynchronous: true,
    evalScripts: true,
    onComplete: function(transport) {
      if (transport.responseText.match(/success/)) {
        refresh_follow_control(user_id, 'removed');
      } else {
        borked();
      }
    }
  });
}

function notify(on, user_id) { 
  var onoff;
  var followleave;

  if (on == true || on == "true") { 
    onoff = "on"; 
    followleave = 'follow';
	} else { 
	  onoff = "off"; 
    followleave = 'leave';
	}

	new Ajax.Request('/friends/' + followleave + '/' + user_id, {
	  asynchronous: true, 
	  evalScripts: true,
	  onComplete: function(transport) {
	    if (transport.responseText.match(/success/)) {        
        refresh_follow_control(user_id, 'notify_' + onoff);
      } else {
        borked();
      }
    }
	});
}

function hide_fail_notice(device_id) { 
	new Ajax.Request('/devices/update/' + device_id, {
    method: 'post',
    postBody:'device[fail_alert]=0',
	  asynchronous: true, 
	  evalScripts: true,
	  onComplete: function(transport) {
	    if (transport.responseText.match(/success/)) {        
        $('alert').hide();
      } else {
        borked();
      }
    }
	});
}

function followDetails(user_id, screen_name) {
	toggleDetails();
}

function toggleDetails() {
	var details = document.getElementById('follow-details');
	var button = document.getElementById('followed');

  var toggle_arrow = document.getElementById('follow-toggle');
	
	if (details.style.display=="block") {
		details.style.display="none";
    toggle_arrow.className = toggle_arrow.className.replace(/opened/, 'closed');
	} else {
		details.style.display="block";
    toggle_arrow.className = toggle_arrow.className.replace(/closed/, 'opened');
	}
}

function buttonType() {
	var button_type = "long";
	
	if (is_following == false) {
		button_type = "short";
	} else if (device_count == 0) { 
		button_type = "med"; 
	}
	
	return button_type;
}
/* End Profile Page Follow Control */


/* People List Actions */
function removePerson(user_id, screen_name, button) {
	removeUser(user_id);
	document.getElementById('removed'+user_id).innerHTML="<button class=\"small\" onclick=\"followPerson("+user_id+", false)\">follow</button> <strong>Ok.</strong> You\'re no longer following " + screen_name +".";
	document.getElementById('removed'+user_id).style.display = "inline";
	document.getElementById('control'+user_id).style.display = "none";
	document.getElementById('block'+user_id).style.display = "none";
}

function followPerson(user_id, email) {
	follow(user_id, email); 
	document.getElementById('removed'+user_id).style.display = "none";
	document.getElementById('control'+user_id).style.display = "block";
	document.getElementById('notifications'+user_id).style.display = "inline";
	document.getElementById('block'+user_id).style.display = "none";
}
/* End People List Actions */


function addEventToObject(obj,evt,func) {
	var oldhandler = obj[evt];
	obj[evt] = (typeof obj[evt] != 'function') ? func : function(ev){oldhandler(ev);func(ev);};
}

/* Search Form Actions */

/* this should be phased out in favor of clearLabeledField */
function clearUserSearch() {
  clearLabeledField('user_search_q');
}

function clearLabeledField(id) {
  $(id).value = '';
  $(id).setStyle({ color: '#000', background: '#fff'});
}

function highlight(container, klass, term) {
  $(container).getElementsByClassName(klass).each(function(detail_span) {
    if (detail_span.innerHTML.toLowerCase().include(term)) {
     detail_span.addClassName('highlight');
    }
  });
}

function followFoundUser(id, is_protected) {
  new Ajax.Request('/friendships/create/' + id, {
	  asynchronous: true, 
	  evalScripts: true,
	  onComplete: function(transport) {
	    if (transport.responseText.match(/success/)) {
        $('user_' + id).addClassName('search_following');

        if (is_protected) {
          new Insertion.Before('follow_button_' + id, "Request to follow sent.&nbsp;");
        } else if (has_devices) {
          Element.show('notification_controls_' + id);
        }

        var rb = '<span id="remove_button_' + id + '">';
        rb += '<button onclick="removeFoundUser(\'' + id + '\');">remove</button>';
        rb += '</span>';
        $('follow_button_' + id).replace(rb);
      } else {
        alert('Something went wrong!  Please refresh the page and try again.');
      }
    }
	});

	return;
}

function removeFoundUser(id) {
  new Ajax.Request('/friendships/destroy/' + id, {
	  asynchronous: true, 
	  evalScripts: true,
	  onComplete: function(transport) {
	    if (transport.responseText.match(/success/)) {
        Element.hide('notification_controls_' + id);
        $('user_' + id).removeClassName('search_following');

        var ab = '<span id="follow_button_' + id + '">';
        ab += '<button onclick="followFoundUser(\'' + id + '\');">follow</button>';
        ab += '</span>';
        $('remove_button_' + id).replace(ab);
      } else {
        alert('Something went wrong!  Please refresh the page and try again.');
      }
    }
	}); 
	
	return;
}

function toggleNotifyFoundUser(on, user_id) {
	if (on == true || on == "true") { 
	  onoff = "follow"; 
	} else { 
	  onoff = "leave"; 
	}
	
	new Ajax.Request('/friends/' + onoff + '/' + user_id, {
	  asynchronous: true, 
	  evalScripts: true,
	  onComplete: function(transport) {
	    if (transport.responseText.match(/success/)) {        
        new Effect.Highlight('notification_controls_' + user_id);
      } else {
        borked();
      }
    }
	});
}

function redirect_with_host(path) {
  l = window.location;
  uri = l.protocol + '//' + l.host + path;
  window.location = uri ;
}

/* this should probably be replaced with exception reporting at some point */
function borked() {
  alert('Something went wrong!  Please refresh the page and try again.');
}

function refresh_follow_control(user_id, action_taken) {
  new Ajax.Updater('follow-control', '/account/refresh_follow_control/' + user_id + '?action_taken=' + action_taken, {asynchronous:true, evalScripts:true}); return false;
}

function addLoadEvent(func) {
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      if (oldonload) {
        oldonload();
      }
      func();
    }
  }
}

function showLinkShrinkNotice() {
  n = $('link_shrink_notice')
  n.style.display = 'block';
  setTimeout('hideLinkShrinkNotice()', 5000);
} 

function hideLinkShrinkNotice() {
  n = $('link_shrink_notice')
  n.style.display = 'none';
}

function showLongMessageNotice() {
  n = $('long_message_notice')
  n.style.display = 'block';
  setTimeout('hideLongMessageNotice()', 3000);
} 

function hideLongMessageNotice() {
  n = $('long_message_notice')
  n.style.display = 'none';
}

function postProcessUpdateKeypress(box, e) {
  var val = box.value; 
  updateStatusTextCharCounter(val);
}

function updateStatusTextCharCounter(value) {
  $('status-field-char-counter').innerHTML = 140 - value.length;
  
  if (value.length > 130) {
    $('status-field-char-counter').setStyle({ color: '#d40d12' });
  } else if (value.length > 120) {
    $('status-field-char-counter').setStyle({ color: '#5c0002' });
  } else {
    $('status-field-char-counter').setStyle({ color: '#cccccc' });
  }
};

function toggleCheckedUnder(under, checkbox) {    
  if (typeof(under) != "object") {
    under = $(under);
  }
  
  if (typeof(checkbox) == "string") {
    checkbox = $(checkbox);
  } else if (checkbox == null) {
    checkbox = under.select('input[type=checkbox]').first();
    
    if (checkbox.checked) {
      checkbox.checked = false;
    } else {
      checkbox.checked = true;
    }
    
    if ($('contacts_table')) {
      toggleSelectAll('contacts_table', 'select_all');
    }
    
    return;
  }
    
  under.select('input').each(function(el) {
    if (checkbox.checked) {
      el.checked = true;
    } else {
      el.checked = false;
    }
  });
}

function toggleSelectAll(under_id, checkbox_id) {
  all_checked = true;
  
  $(under_id).select('input').each(function(el) {
    if (!el.checked) {
      $(checkbox_id).checked = false;
      all_checked = false;
    }
  });
  
  if (all_checked) {
    $(checkbox_id).checked = true;
  }
}

/**
 * Copy the value of an input field's title attribute to its value attribute.
 * Clear the input field on focus if its value is the same as its title.
 * Repopulate the input field on blur if it is empty.
 * Hide the input field's associated label if it has one.
 */
var autoPopulate = {
	sInputClass:'populate', // Class name for input elements to autopopulate
	/**
	 * Main function
	 */
	init:function() {
		// Check for DOM support
		if (!document.getElementById || !document.createTextNode) {return;}
		// Find all input elements with the given className
		var arrInputs = document.getElementsByClassName(autoPopulate.sInputClass);
		var iInputs = arrInputs.length;
		var oInput;
		for (var i=0; i<iInputs; i++) {
			oInput = arrInputs[i];
			// Make sure it's a text input
			if( oInput.type != 'text' && oInput.type != 'password') { continue; }
			// If value is empty and title is not, assign title to value
			if ((oInput.value == '') && (oInput.title != '')) { autoPopulate.setInput(oInput) }
      else { oInput.style.color = '#000'; }
			// Add event handlers for focus and blur
			autoPopulate.addEvent(oInput, 'focus', function() {
				// If value and title are equal on focus, clear value
				if (this.value == this.title) {
					this.value = '';
          this.style.color = '#000';
					this.select(); // Make input caret visible in IE
				}
			});
			autoPopulate.addEvent(oInput, 'blur', function() {
				// If the field is empty on blur, assign title to value
				if (!this.value.length) { autoPopulate.setInput(this) }
			});
		}
	},
  
  setInput:function(obj) {
    obj.value = obj.title; obj.style.color = '#94999d'
  },

	addEvent:function(obj, type, fn) {
		if (obj.addEventListener)
			obj.addEventListener(type, fn, false);
		else if (obj.attachEvent) {
			obj["e"+type+fn] = fn;
			obj[type+fn] = function() {obj["e"+type+fn](window.event);}
			obj.attachEvent("on"+type, obj[type+fn]);
		}
	}
};

//  Prototip 1.2.0_pre1 - 17-12-2007
var Prototip={Version:"1.2.0_pre1",REQUIRED_Prototype:"1.6.0",REQUIRED_Scriptaculous:"1.8.0",start:function(){this.require("Prototype");Tips.initialize();Element.observe(window,"unload",this.unload);},require:function(A){if((typeof window[A]=="undefined")||(this.convertVersionString(window[A].Version)<this.convertVersionString(this["REQUIRED_"+A]))){throw ("Prototip requires "+A+" >= "+this["REQUIRED_"+A]);}},convertVersionString:function(A){var B=A.split(".");return parseInt(B[0])*100000+parseInt(B[1])*1000+parseInt(B[2]);},viewport:{getDimensions:function(){var A={};var C=Prototype.Browser;$w("width height").each(function(E){var B=E.capitalize();A[E]=(C.WebKit&&!document.evaluate)?self["inner"+B]:(C.Opera)?document.body["client"+B]:document.documentElement["client"+B];});return A;}},capture:function(A){if(!Prototype.Browser.IE){A=A.wrap(function(D,C){var B=C.relatedTarget,E=C.currentTarget;if(B&&B.nodeType==Node.TEXT_NODE){B=B.parentNode;}if(B&&B!=E&&B.descendantOf&&!(B.descendantOf(E))){D(C);}});}return A;},unload:function(){Tips.removeAll();}};var Tips={closeButtons:false,zIndex:1200,tips:[],visible:[],initialize:function(){this.zIndexTop=this.zIndex;},useEvent:(function(A){return{"mouseover":(A?"mouseenter":"mouseover"),"mouseout":(A?"mouseleave":"mouseout"),"mouseenter":(A?"mouseenter":"mouseover"),"mouseleave":(A?"mouseleave":"mouseout")};})(Prototype.Browser.IE),fixIE:(function(B){var A=new RegExp("MSIE ([\\d.]+)").exec(B);return A?(parseFloat(A[1])<=6):false;})(navigator.userAgent),add:function(A){this.tips.push(A);},remove:function(A){var B=this.tips.find(function(C){return C.element==$(A);});if(B){B.deactivate();if(B.tooltip){B.wrapper.remove();if(Tips.fixIE){B.iframeShim.remove();}}this.tips=this.tips.without(B);}},removeAll:function(){this.tips.each(function(A){this.remove(A.element);}.bind(this));},raise:function(B){if(B.highest){return ;}if(this.visible.length==0){this.zIndexTop=this.zIndex;for(var A=0;A<this.tips.length;A++){this.tips[A].wrapper.style.zIndex=this.zIndex;}}B.style.zIndex=this.zIndexTop++;for(var A=0;A<this.tips.length;A++){this.tips[A].wrapper.highest=false;}B.highest=true;},addVisibile:function(A){this.removeVisible(A);this.visible.push(A);},removeVisible:function(A){this.visible=this.visible.without(A);}};Tips.initialize();var Tip=Class.create({initialize:function(A,B){this.element=$(A);Tips.remove(this.element);this.content=B;var D=(arguments[2]&&arguments[2].hook);var C=(arguments[2]&&arguments[2].showOn=="click");this.options=Object.extend({className:"default",closeButton:Tips.closeButtons,delay:!C?0.2:false,duration:0.3,effect:false,hideAfter:false,hideOn:"mouseleave",hook:false,offset:D?{x:0,y:0}:{x:16,y:16},fixed:D?true:false,showOn:"mousemove",target:this.element,title:false,viewport:D?false:true},arguments[2]||{});this.target=$(this.options.target);this.setup();if(this.options.effect){Prototip.require("Scriptaculous");this.queue={position:"end",limit:1,scope:this.wrapper.identify()};}Tips.add(this);this.activate();},setup:function(){this.wrapper=new Element("div",{"class":"prototip"}).setStyle({display:"none",zIndex:Tips.zIndex});this.wrapper.identify();if(Tips.fixIE){this.iframeShim=new Element("iframe",{"class":"iframeShim",src:"javascript:false;"}).setStyle({display:"none",zIndex:Tips.zIndex-1});}this.tip=new Element("div",{"class":"content"}).insert(this.content);this.tip.insert(new Element("div").setStyle({clear:"both"}));if(this.options.closeButton||(this.options.hideOn.element&&this.options.hideOn.element=="closeButton")){this.closeButton=new Element("a",{href:"#","class":"close"});}},build:function(){if(Tips.fixIE){document.body.appendChild(this.iframeShim).setOpacity(0);}var D="wrapper";if(this.options.effect){this.effectWrapper=this.wrapper.appendChild(new Element("div",{"class":"effectWrapper"}));D="effectWrapper";}this.tooltip=this[D].appendChild(new Element("div",{"class":"tooltip "+this.options.className}));if(this.options.title||this.options.closeButton){this.toolbar=this.tooltip.appendChild(new Element("div",{"class":"toolbar"}));this.title=this.toolbar.appendChild(new Element("div",{"class":"title"}).update(this.options.title||" "));}this.tooltip.insert(this.tip);document.body.appendChild(this.wrapper);var A=(this.options.effect)?[this.wrapper,this.effectWrapper]:[this.wrapper];if(Tips.fixIE){A.push(this.iframeShim);}var C=this.wrapper.getWidth();A.invoke("setStyle",{width:C+"px"});if(this.toolbar){this.wrapper.setStyle({visibility:"hidden"}).show();this.toolbar.setStyle({width:this.toolbar.getWidth()+"px"});this.wrapper.hide().setStyle({visibility:"visible"});}if(this.closeButton){this.title.insert({top:this.closeButton}).insert(new Element("div").setStyle({clear:"both"}));}var B=this.wrapper.getHeight();A.invoke("setStyle",{width:C+"px",height:B+"px"});this[this.options.effect?D:"tooltip"].hide();},activate:function(){this.eventShow=this.showDelayed.bindAsEventListener(this);this.eventHide=this.hide.bindAsEventListener(this);if(this.options.fixed&&this.options.showOn=="mousemove"){this.options.showOn="mouseover";}if(this.options.showOn==this.options.hideOn){this.eventToggle=this.toggle.bindAsEventListener(this);this.element.observe(this.options.showOn,this.eventToggle);}var C={"element":this.eventToggle?[]:[this.element],"target":this.eventToggle?[]:[this.target],"tip":this.eventToggle?[]:[this.wrapper],"closeButton":[],"none":[]};var A=this.options.hideOn.element;this.hideElement=A||(!this.options.hideOn?"none":"element");this.hideTargets=C[this.hideElement];if(!this.hideTargets&&A&&Object.isString(A)){this.hideTargets=this.tip.select(A);}var D={"mouseenter":"mouseover","mouseleave":"mouseout"};$w("show hide").each(function(H){var G=H.capitalize();var F=(this.options[H+"On"].event||this.options[H+"On"]);this[H+"Action"]=F;if(["mouseenter","mouseleave","mouseover","mouseout"].include(F)){this[H+"Action"]=(Tips.useEvent[F]||F);this["event"+G]=Prototip.capture(this["event"+G]);}}.bind(this));if(!this.eventToggle){this.element.observe(this.options.showOn,this.eventShow);}if(this.hideTargets){this.hideTargets.invoke("observe",this.hideAction,this.eventHide);}if(!this.options.fixed&&this.options.showOn=="click"){this.eventPosition=this.position.bindAsEventListener(this);this.element.observe("mousemove",this.eventPosition);}this.buttonEvent=this.hide.wrap(function(F,E){E.stop();F(E);}).bindAsEventListener(this);if(this.closeButton){this.closeButton.observe("click",this.buttonEvent);}if(this.options.showOn!="click"&&(this.hideElement!="element")){this.eventCheckDelay=Prototip.capture(function(){this.clearTimer("show");}).bindAsEventListener(this);this.element.observe(Tips.useEvent["mouseout"],this.eventCheckDelay);}var B=[this.element,this.wrapper];this.activityEnter=Prototip.capture(function(){Tips.raise(this.wrapper);this.cancelHideAfter();}).bindAsEventListener(this);this.activityLeave=Prototip.capture(this.hideAfter).bindAsEventListener(this);B.invoke("observe",Tips.useEvent["mouseover"],this.activityEnter);B.invoke("observe",Tips.useEvent["mouseout"],this.activityLeave);},deactivate:function(){if(this.options.showOn==this.options.hideOn){this.element.stopObserving(this.options.showOn,this.eventToggle);}else{this.element.stopObserving(this.options.showOn,this.eventShow);if(this.hideTargets){this.hideTargets.invoke("stopObserving");}}if(this.eventPosition){this.element.stopObserving("mousemove",this.eventPosition);}if(this.closeButton){this.closeButton.stopObserving();}if(this.eventCheckDelay){this.element.stopObserving("mouseout",this.eventCheckDelay);}this.wrapper.stopObserving();this.element.stopObserving(Tips.useEvent["mouseover"],this.activityEnter);this.element.stopObserving(Tips.useEvent["mouseout"],this.activityLeave);},showDelayed:function(A){if(!this.tooltip){this.build();}this.position(A);if(this.wrapper.visible()){return ;}this.clearTimer("show");this.showTimer=this.show.bind(this).delay(this.options.delay);},clearTimer:function(A){if(this[A+"Timer"]){clearTimeout(this[A+"Timer"]);}},show:function(){if(this.wrapper.visible()&&this.options.effect!="appear"){return ;}if(Tips.fixIE){this.iframeShim.show();}Tips.addVisibile(this.wrapper);this.wrapper.show();if(!this.options.effect){this.tooltip.show();}else{if(this.activeEffect){Effect.Queues.get(this.queue.scope).remove(this.activeEffect);}this.activeEffect=Effect[Effect.PAIRS[this.options.effect][0]](this.effectWrapper,{duration:this.options.duration,queue:this.queue});}},hideAfter:function(A){if(!this.options.hideAfter){return ;}this.cancelHideAfter();this.hideAfterTimer=this.hide.bind(this).delay(this.options.hideAfter);},cancelHideAfter:function(){if(this.options.hideAfter){this.clearTimer("hideAfter");}},hide:function(){this.clearTimer("show");if(!this.wrapper.visible()){return ;}if(!this.options.effect){if(Tips.fixIE){this.iframeShim.hide();}this.tooltip.hide();this.wrapper.hide();Tips.removeVisible(this.wrapper);}else{if(this.activeEffect){Effect.Queues.get(this.queue.scope).remove(this.activeEffect);}this.activeEffect=Effect[Effect.PAIRS[this.options.effect][1]](this.effectWrapper,{duration:this.options.duration,queue:this.queue,afterFinish:function(){if(Tips.fixIE){this.iframeShim.hide();}this.wrapper.hide();Tips.removeVisible(this.wrapper);}.bind(this)});}},toggle:function(A){if(this.wrapper&&this.wrapper.visible()){this.hide(A);}else{this.showDelayed(A);}},position:function(A){Tips.raise(this.wrapper);var E={left:this.options.offset.x,top:this.options.offset.y};var F=Position.cumulativeOffset(this.target);var B=this.wrapper.getDimensions();var I={left:(this.options.fixed)?F[0]:Event.pointerX(A),top:(this.options.fixed)?F[1]:Event.pointerY(A)};I.left+=E.left;I.top+=E.top;if(this.options.hook){var K={target:this.target.getDimensions(),tip:B};var L={target:Position.cumulativeOffset(this.target),tip:Position.cumulativeOffset(this.target)};for(var H in L){switch(this.options.hook[H]){case"topRight":L[H][0]+=K[H].width;break;case"topMiddle":L[H][0]+=(K[H].width/2);break;case"rightMiddle":L[H][0]+=K[H].width;L[H][1]+=(K[H].height/2);break;case"bottomLeft":L[H][1]+=K[H].height;break;case"bottomRight":L[H][0]+=K[H].width;L[H][1]+=K[H].height;break;case"bottomMiddle":L[H][0]+=(K[H].width/2);L[H][1]+=K[H].height;break;case"leftMiddle":L[H][1]+=(K[H].height/2);break;}}I.left+=-1*(L.tip[0]-L.target[0]);I.top+=-1*(L.tip[1]-L.target[1]);}if(!this.options.fixed&&this.element!==this.target){var C=Position.cumulativeOffset(this.element);I.left+=-1*(C[0]-F[0]);I.top+=-1*(C[1]-F[1]);}if(!this.options.fixed&&this.options.viewport){var J=document.viewport.getScrollOffsets();var G=Prototip.viewport.getDimensions();var D={left:"width",top:"height"};for(var H in D){if((I[H]+B[D[H]]-J[H])>G[D[H]]){I[H]=I[H]-B[D[H]]-2*E[H];}}}var M={left:I.left+"px",top:I.top+"px"};this.wrapper.setStyle(M);if(Tips.fixIE){this.iframeShim.setStyle(M);}}});Prototip.start();
