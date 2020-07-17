		
	var idOfCollapsibleLists = [];
	
	var imageFolder = '';	// Path to images
	var plusImage = 'CollapsibleListPlus.gif';
	var minusImage = 'CollapsibleListMinus.gif';
	var initExpandedNodes = '';	// Nodes to expand on startup;
	var curExpandedNodes = '';	// Cookie - currently expanded nodes;
	
	var treeUlCounter = 0;
	var nodeId = 1;
	
	/*
	These cookie functions are downloaded from 
	http://www.mach5.com/support/analyzer/manual/html/General/CookiesJavaScript.htm
	*/
	function Get_Cookie(name) { 
	   var start = document.cookie.indexOf(name+"="); 
	   var len = start+name.length+1; 
	   if ((!start) && (name != document.cookie.substring(0,name.length))) return null; 
	   if (start == -1) return null; 
	   var end = document.cookie.indexOf(";",len); 
	   if (end == -1) end = document.cookie.length; 
	   return unescape(document.cookie.substring(len,end)); 
	} 
	// This function has been slightly modified
	function Set_Cookie(name,value,expires,path,domain,secure) { 
		expires = expires * 60*60*24*1000;
		var today = new Date();
		var expires_date = new Date( today.getTime() + (expires) );
	    var cookieString = name + "=" +escape(value) + 
	       ( (expires) ? ";expires=" + expires_date.toGMTString() : "") + 
	       ( (path) ? ";path=" + path : "") + 
	       ( (domain) ? ";domain=" + domain : "") + 
	       ( (secure) ? ";secure" : ""); 
	    document.cookie = cookieString; 
	} 
	
	function expandAll(treeId)
	{
		var menuItems = document.getElementById(treeId).getElementsByTagName('LI');
		for(var no=0;no<menuItems.length;no++){
			var subItems = menuItems[no].getElementsByTagName('UL');
			if(subItems.length>0 && subItems[0].style.display!='block'){
				showHideNode(false,menuItems[no].id.replace(/[^0-9]/g,''));
			}			
		}
	}
	
	function collapseAll(treeId)
	{
		var menuItems = document.getElementById(treeId).getElementsByTagName('LI');
		for(var no=0;no<menuItems.length;no++){
			var subItems = menuItems[no].getElementsByTagName('UL');
			if(subItems.length>0 && subItems[0].style.display=='block'){
				showHideNode(false,menuItems[no].id.replace(/[^0-9]/g,''));
			}			
		}		
	}
	
	function parseSubItems(ulId,parentId)
	{
		
		if(curExpandedNodes){
			var nodes = curExpandedNodes.split(',');
		}
		var branchObj = document.getElementById(ulId);
		var menuItems = branchObj.getElementsByTagName('LI');	// Get an array of all menu items
		for(var no=0;no<menuItems.length;no++){
			var imgs = menuItems[no].getElementsByTagName('IMG');
			if(imgs.length>0)continue;
			nodeId++;
			var subItems = menuItems[no].getElementsByTagName('UL');
			var img = document.createElement('IMG');
			img.src = imageFolder + plusImage;
			img.onclick = showHideNode;
			if(subItems.length==0)img.style.visibility='hidden';else{
				subItems[0].id = 'tree_ul_' + treeUlCounter;
				treeUlCounter++;
			}
			var aTag = menuItems[no].getElementsByTagName('A')[0];
			aTag.onclick = showHideNode;
							
			menuItems[no].insertBefore(img,aTag);
			menuItems[no].id = 'collapsibleListNode' + nodeId;
			var tmpParentId = menuItems[no].getAttribute('parentId');
			if(!tmpParentId)tmpParentId = menuItems[no].tmpParentId;
			if(tmpParentId && nodes[tmpParentId])showHideNode(false,nodes[no]);	
		}		
	}
		
			
	function showHideNode(e,inputId)
	{
		if(inputId){
			if(!document.getElementById('collapsibleListNode'+inputId))return;
			thisNode = document.getElementById('collapsibleListNode'+inputId).getElementsByTagName('IMG')[0]; 
		}else {
			thisNode = this;
			if(this.tagName=='A')thisNode = this.parentNode.getElementsByTagName('IMG')[0];	
			
		}
		if(thisNode.style.visibility=='hidden')return;
		var parentNode = thisNode.parentNode;
		inputId = parentNode.id.replace(/[^0-9]/g,'');
		if(thisNode.src.indexOf(plusImage)>=0){
			thisNode.src = thisNode.src.replace(plusImage,minusImage);
			var ul = parentNode.getElementsByTagName('UL')[0];
			ul.style.display='block';
			if(!curExpandedNodes)curExpandedNodes = ',';
			if(curExpandedNodes.indexOf(',' + inputId + ',')<0) curExpandedNodes = curExpandedNodes + inputId + ',';
		}else{
			thisNode.src = thisNode.src.replace(minusImage,plusImage);
			parentNode.getElementsByTagName('UL')[0].style.display='none';
			curExpandedNodes = curExpandedNodes.replace(',' + inputId,'');
		}	
		Set_Cookie('collapsibleList_expandedNodes',curExpandedNodes,500);
		
		return false;
	}
	
	function initTree()
	{
		
		for(var treeCounter=0;treeCounter<idOfCollapsibleLists.length;treeCounter++){
			var collapsibleList = document.getElementById(idOfCollapsibleLists[treeCounter]);
			var menuItems = collapsibleList.getElementsByTagName('LI');	// Get an array of all menu items
			for(var no=0;no<menuItems.length;no++){					
				nodeId++;
				var subItems = menuItems[no].getElementsByTagName('UL');
				var img = document.createElement('IMG');
				img.src = imageFolder + plusImage;
				img.onclick = showHideNode;
				if(subItems.length==0)img.style.visibility='hidden';else{
					subItems[0].id = 'tree_ul_' + treeUlCounter;
					treeUlCounter++;
				}
				var aTag = menuItems[no].getElementsByTagName('A')[0];
				if (typeof (aTag) != 'undefined') {
				    aTag.onclick = showHideNode;
				    menuItems[no].insertBefore(img, aTag);
				    if (!menuItems[no].id) menuItems[no].id = 'collapsibleListNode' + nodeId;
				}
			}	
		
		}
		curExpandedNodes = initExpandedNodes;
		if(curExpandedNodes){
			var nodes = curExpandedNodes.split(',');
			for(var no=0;no<nodes.length;no++){
				if(nodes[no])showHideNode(false,nodes[no]);	
			}			
		}	
	}
	
	function AddList(listName)
	{
		idOfCollapsibleLists.length++;
		idOfCollapsibleLists[idOfCollapsibleLists.length-1] = listName;
	}

	function SetInitExpandedNodes(nodeList)
	{
		initExpandedNodes = nodeList;
	}
	
	window.onload = initTree;	