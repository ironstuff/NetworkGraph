var width = window.innerWidth
var height = window.innerHeight

d3.json("static/5g.json").then(function(data) {

	var svg = d3.select('#svg')
            .attr('width', width)
            .attr('height', height);

	var brush = svg.append("g")
	  .append("g")
	  .attr("class", "brush")
	  .attr("width", width)
	  .attr("height", height)
	  .style("display", "none");


	var container = d3.select("g")
	  .append("g")
	  .attr("class", "container");

    var linkElements = container.append("g")
      .attr("class", "link_layout")
      .selectAll(".line")
      .data(data.links)
      .enter()
      .append("path")
      .attr('class', 'line')
      .attr("id", function( link, i ){
      	return 'link-' + i;
      });

    var nodeElements = container.append("g")
      .attr("class", "node_layout")
      .selectAll(".node")
      .data(data.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr('cx', node => node.x)
      .attr('cy', node => node.y)
     //  .on('dragstart', dragstartFn)
	    // .on('drag', dragFn)
	    // .on('dragend', dragendFn);

    nodeElements.append("circle")
      .attr("r", function () { return 16; })
      .on("mousedown", mousedowned)
      .on("mouseup", mouseuped)
      .on("mouseover", hoverNode)
      // .call(d3.drag().on("drag", function(node) {
      //   nodeElements.filter(function(d) { return d.selected; })
      //   	.each(function (node) {
      //   		node.x += d3.event.dx;
      //   		node.y += d3.event.dy;
      //   		d3.select(this)
      //   		  .attr("transform", "translate(" + node.x + "," + node.y + ")");
      //   	})


      //   linkElements.filter(function(d) { return d.source.selected; })
      //     .attr("x1", function(d) { return d.source.x; })
      //     .attr("y1", function(d) { return d.source.y; });

      //   linkElements.filter(function(d) { return d.target.selected; })
      //     .attr("x2", function(d) { return d.target.x; })
      //     .attr("y2", function(d) { return d.target.y; });
      // }
      // ));

    nodeElements.append("text")
    	.attr("class", "node_text")
        .attr("font-size", 5)
        .attr("dy", ".35em")
        .attr("x", function (node) {
        	return textBreaking(d3.select(this), node.label);
        });

    // var textElements = svg.append("g")
    //   .attr("class", "text_layout")
    //   .selectAll("g")
    //   .data(data.nodes)
    //   .enter().append("text")
    //   .text(function (node) { return  node.label })
    //   .style("display", "none")
    //   .attr("font-size", 4);

    var linkForce = d3
      .forceLink()
      .id(function (link) { return link.id })
      .strength(0.7);

    var simulation = d3
      .forceSimulation()
      .force('link', linkForce)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2 + 150, height / 2))
      .alpha(1);


      simulation.nodes(data.nodes).on('tick', () => {
	        nodeElements.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })
	        linkElements.attr("d", function(link) {	return genLinkPath(link); })
	 		lineTextElements.attr('dx', link => getLineTextDx(link));
	 		})
	      .force("link").links(data.links);

	// 连线的文字
    const lineTextElements = container.append('g')
    	.attr("class", "text_layout")
    	.selectAll('.linetext')
        .data(data.links)
        .enter()
        .append('text')
        .style('font-size', 10)
        .attr('class', 'link_text')
        .attr('dx', function(link) { return getLineTextDx(link) })
        .attr("dy", 5);

     lineTextElements.append('textPath')
     	.attr('xlink:href', function (link, i) {
     		return '#link-' + i;
     	})
        .text(link => link.label);

    // function isNeighborLink(node, link) {
    //   return link.target.id === node.id || link.source.id === node.id;
    // }


    // function getNodeColor(node, neighbors) {
    //   if (Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1) {
    //     return node.level === 1 ? 'blue' : 'green';
    //   }

    //   return node.level === 1 ? 'red' : 'gray';
    // }

    // function getLinkColor(node, link) {
    //   return isNeighborLink(node, link) ? 'yellow' : 'yellow';
    // }

    // function getTextColor(node, neighbors) {
    //   return Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1 ? 'white' : 'black';
    // }
    
    // 掠过显示节点信息
    function hoverNode(hover_node) {
        var node_info = d3.select("#node_info")
                          .style("display", "block");
        node_info.selectAll(".info").remove();
        for(var item in hover_node){
            if(['x', 'y', 'vx', 'vy', 'index', 'selected', 'previouslySelected']
                .indexOf(item.toString()) != -1) {
                continue;
            }
            node_info.append('p')
                     .attr("class", "info")
                     .text(item + ": " + hover_node[item]);
        }
    }

    var ctrl = false;
    function mousedowned(node) {
      node.selected = true;
      d3.select(this.parentNode).classed("selected", true);
      d3.event.stopPropagation();
    }

    function mouseuped(node) {
      if (d3.event.ctrlKey) {
      	ctrl = true;
        return
      }
      else {
        node.selected = false;
        ctrl = false;
        d3.select(this.parentNode).classed("selected", false);
      }
    }
    
    svg.on("click", function() {
      if (!ctrl) {
	      d3.selectAll(".selected")
	        .classed("selected", false);
	      nodeElements.filter(function(d) {
	          d.selected = false;
	      });
      }
    })

    function brushstarted() {
      if (d3.event.sourceEvent.type !== "end") {
        nodeElements.classed("selected", false);
        data.nodes.map(function(node) {
          node.selected = false;
        });
      }
    }

    function brushed() {
      if (d3.event.sourceEvent.type !== "end") {
        var selection = d3.event.selection;
        nodeElements.classed("selected", function(d) {
          return d.selected = d.previouslySelected ^
            (selection != null
            && selection[0][0] <= d.x && d.x < selection[1][0]
            && selection[0][1] <= d.y && d.y < selection[1][1]);
        });
      }
    }

    function brushended() {
        if (d3.event.selection != null) {
          d3.select(this).call(d3.event.target.move, null);
        }
    }

    brushEvent = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    brush.call(brushEvent);

    // 框选功能
    data.nodes.forEach(function(d) {
        d.selected = false;
        d.previouslySelected = false;
    });

    // 缩放功能实现
    function zoomed() {
      container.attr("transform", d3.event.transform);
    }

    svg.call(d3.zoom().scaleExtent([0.1, 10]).on("zoom", zoomed))
       .on('dblclick.zoom', null);

    d3.select("#zoom_out").on("click", function() {
       zoom.scaleBy(container, 2);
    });      
    d3.select("#zoom_in").on("click", function() {
       zoom.scaleBy(container, 0.5);
    });      
    d3.select("#zoom_reset").on("click", function() {
       container.call(zoom.transform, d3.zoomIdentity);
    });

    // 重置布局
    d3.select("#reset").on("click", function() {
        simulation.force('center', d3.forceCenter(width / 2, height / 2));
        simulation.restart();
    });

    // 框选模式
    var isBrush = false;
    d3.select("#brush_mode")
      .on("click", function () {
        isBrush = !isBrush;
        if (isBrush) {
          d3.select(this).classed("on", true);
          brush.style("display", "block");
        }
        else {
          d3.select(this).classed("on", false);
          brush.style("display", "none");
        }
      })

    // 标签显示开关功能实现
    // var node_text_state = false;
    // var label_switch_button = d3.select("#label_switch");
    // label_switch_button.on("click", function() {
    //     if (node_text_state) {
    //         label_switch_button.select("i").attr("class","fa fa-toggle-off");
    //         textElements.style("display", "none");
    //     }
    //     else {
    //         label_switch_button.select("i").attr("class","fa fa-toggle-on");
    //         textElements.style("display", "block");
    //     }
    //     node_text_state = !node_text_state;
    // })    
    // 节点标签显示开关功能实现
    var node_text_state = false;
    var node_switch = d3.select("#node_switch");
    var node_text = d3.selectAll(".node_text");
    node_switch.on("click", function() {
        if (node_text_state) {
            node_switch.select("i").attr("class","fa fa-toggle-off");
            node_text.style("display", "none");
        }
        else {
            node_switch.select("i").attr("class","fa fa-toggle-on");
            node_text.style("display", "block");
        }
        node_text_state = !node_text_state;
    })

    // 关系标签显示开关功能实现
    var link_text_state = false;
    var link_switch = d3.select("#link_switch");
    var link_text = d3.selectAll(".link_text");
    link_switch.on("click", function() {
        if (link_text_state) {
            link_switch.select("i").attr("class","fa fa-toggle-off");
            link_text.style("display", "none");
        }
        else {
            link_switch.select("i").attr("class","fa fa-toggle-on");
            link_text.style("display", "block");
        }
        link_text_state = !link_text_state;
    })


    // 调整图参数
    d3.select("#node_size").on("input propertychange", function() {
        var size = this.value;
        nodeElements.selectAll("circle").attr("r", function(node, i){
            return size;
        });
    });
    d3.select("#node_opacity").on("input propertychange", function() {
        var opacity = this.value;
        nodeElements.style("opacity", function(node, i){
            return opacity;
        });
    });        
    d3.select("#node_stroke").on("input propertychange", function() {
        var stroke_width = this.value;
        nodeElements.selectAll("circle").style("stroke-width", function(node, i){
            return stroke_width;
        });
    });
    d3.select("#link_strength").on("input propertychange", function() {
    	simulation.force("link").strength(+this.value);
	    simulation.alpha(1).restart();
    });
    d3.select("#line_color").on("change", function() {
    	d3.selectAll(".line").style("stroke", this.value);
    });
    d3.select("#line_stroke_width").on("input propertychange", function() {
        var line_stroke_width = this.value;
        linkElements.style("stroke-width", function(node, i){
            return line_stroke_width;
        });
    });
    
    // 颜色标记
    d3.selectAll(".color_item")
      .on("click", changeColor);
    function changeColor() {
        nodeElements.filter(function(d) { return d.selected; })
            .attr("fill", d3.select(this).style("background-color"));
    }
    d3.select("#node_color").on("change", function () {
        nodeElements.filter(function(d) { return d.selected; })
            .attr("fill", this.value);
    });
    d3.select("#setting_button").on("click", changeShowState);
    var setting_box = d3.select("#setting_box");
    var hide_setting = d3.select("#hide_setting")
                         .on("click", hideSettingBox);
    var isShow = false;
    function changeShowState() {
        isShow = !isShow;
        if (isShow) {
            setting_box.style("display", "block");
        }
        else {
            setting_box.style("display", "none");
        }
    }
    function hideSettingBox() {
        isShow = false;
        setting_box.style("display", "none");
    }

    d3.select("#resize").on("click", resize);
    var check = true;
    var resize_button = d3.select("#resize").select("i");
    function resize() {
        if (check) {
            enterFullScreen()
            resize_button.attr("class","fa fa-compress");
        }
        else {
            exitFullScreen()
            resize_button.attr("class","fa fa-expand");
        }
        check = !check;
    }

    // 功能区按钮
    function getNeighbors() {
    	var neighbors = [];
    	selected_nodes = data.nodes.filter(function (node) {return node.selected});
		data.links.forEach(function (link) {
			selected_nodes.forEach(function (node) {
				if(node.id === link.target.id) { neighbors.push(link.source.id) }
				else if (node.id === link.source.id) { neighbors.push(link.target.id) }
			})
		})
		return neighbors
	}
    d3.select("#selecct_correlation")
      .on("click", selecct_correlation);
    function selecct_correlation() {
    	neighbors = getNeighbors()
    	d3.selectAll(".node").each(function(node) {
    		if(neighbors.indexOf(node.id) > -1) {
    			d3.select(this).classed("selected", true);
    			node.selected = true;
    		}
    	})
	}
})

function dragstartFn(d) {
    draging = true;
    d3.event.sourceEvent.stopPropagation();
    force.start();
}

function dragFn(d) {
    draging = true;
    d3.select(this)
        .attr('cx', d.x = d3.event.x)
        .attr('cy', d.y = d3.event.y);
}

function dragendFn(d) {
    draging = false;
    force.stop();  
}

function textBreaking(d3text, text) {
    const len = text.length;
    if (len <= 4) {
        d3text.append('tspan')
            .attr('x', 0)
            .attr('y', 2)
            .text(text);
    } else {
        const topText = text.substring(0, 4);
        const midText = text.substring(4, 9);
        let botText = text.substring(9, len);
        let topY = -9;
        let midY = 2;
        let botY = 10;
        if (len <= 10) {
            topY += 5;
            midY += 5;
        } else {
            botText = text.substring(9, 11) + '...';
        }

        d3text.text('');
        d3text.append('tspan')
            .attr('x', 0)
            .attr('y', topY)
            .text(function () {
                return topText;
            });
        d3text.append('tspan')
            .attr('x', 0)
            .attr('y', midY)
            .text(function () {
                return midText;
            });
        d3text.append('tspan')
            .attr('x', 0)
            .attr('y', botY)
            .text(function () {
                return botText;
            });
    }
}

// 生成关系连线路径
function genLinkPath(link) {

    var sx = link.source.x;
    var tx = link.target.x;
    var sy = link.source.y;
    var ty = link.target.y;

    return 'M' + sx + ',' + sy + ' L' + tx + ',' + ty;
}

function getLineTextDx(d) {

    const sx = d.source.x;
    const sy = d.source.y;
    const tx = d.target.x;
    const ty = d.target.y;

    const distance = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));

    // const textLength = d.label.length;
    const textLength = d.label.length;
    const deviation = 8; // 调整误差
    const dx = (distance - 3 * textLength) / 2;

    return dx;
}