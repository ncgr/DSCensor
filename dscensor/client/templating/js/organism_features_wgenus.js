var histogramSelection = {'genes' : 'Genes', 'exons' : 'Exons', 'mrnas' : 'mRNAs', 'pps' : 'Polypeptides', 'ppds' : 'Polypeptide Domains', 'chrs' : 'Chromosomes', 'lgs' : 'Linkage Groups', 'gms' : 'Genetic Markers', 'primers' : 'Primers', 'qtls' : 'QTLs', 'con_regs' : 'Consensus Regions', 'syn_regs' : 'Syntenic Regions'};
var global_domain_filter = {};
var features_filter = ['genes'];
var sunburst_on = 1;
$(document).ready(function(){
    var acount = 0;
    var name_length = 0;
    var ordering = [];
    var organismFeatures = feature_counts.dimension(function(d){
        acount++;
        if (d.label.length > name_length){
            name_length = d.label.length;
        }
        ordering.push(d.label);
        return d.label;
    });
    var left_margin = name_length * 4 + 10;
    var bottom_margin = name_length * 4 + 10;
    var w = acount * 30 + left_margin + 60;
    var organismFeaturesTable = $('#features-datatable').dataTable({
        "data": feature_table_data,
        "columns": feature_header,
        "colReorder" : {
            fixedColumnsLeft: 1
        },
        "search": {
            "caseInsensitive": true,
            "regex": true
        },
        "select" : true,
        "order" : []
    });

    $("#feature_body").append('<div class="container" style="position:relative;left:-50px;padding-top:10px;padding-bottom:10px"> <label class="checkbox-inline">      <input type="checkbox" value="genes" class="customfilters-1" checked>Genes    </label>    <label class="checkbox-inline">      <input type="checkbox" value="exons" class="customfilters-1">Exons    </label>    <label class="checkbox-inline" class="customfilters-1">      <input type="checkbox" value="mrnas" class="customfilters-1">mRNAs    </label>    <label class="checkbox-inline" class="customfilters-1">    <input type="checkbox" value="pps" class="customfilters-1">Polypeptides    </label>    <label class="checkbox-inline" class="customfilters-1">    <input type="checkbox" value="ppds" class="customfilters-1">Polypeptide Domains    </label>    <label class="checkbox-inline" class="customfilters-1">    <input type="checkbox" value="chrs" class="customfilters-1">Chromosomes    </label>    <label class="checkbox-inline" class="customfilters-1">    <input type="checkbox" value="lgs" class="customfilters-1">Linkage Groups    </label>    <button id="filtercustom-1" style="inline:block;position:relative;left:10px" class="customfilters">Render</button></div><li class="list-group-item"><span id="customHistogram-1"></span></li>');
    var customHistogram1 = dc.barChart("#customHistogram-1");
    customHistogram1
        .width(w)
        .height(600)
        .dimension(organismFeatures)
        .margins({top: 50, right: 50, bottom: bottom_margin, left: left_margin})
        .x(d3.scale.ordinal().domain(ordering))
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Organism Identifier")
        .yAxisLabel("Counts");
    var count = 0;
    var all_filters = generateFilters(organismFeatures, global_domain_filter);
    for (var i = 0;i<histogramSelection.length;i++){
       var k_label = histogramSelection[i].label;
       var k_key = histogramSelection[i].key;
       var k_plot = histogramSelection[i].show;
       if(k_plot === true){
           if (count == 0){
               customHistogram1.group(all_filters[k_key], k_label);
           } else {
               customHistogram1.stack(all_filters[k_key], k_label);
           }
           count++;
        }
    }
    customHistogram1
        .group(all_filters['genes'], histogramSelection['genes'])
        .transitionDuration(10)
        .legend((dc.legend().x(40).y(0).itemHeight(16).gap(4)))
        .elasticY(true)
        .on('renderlet', function(chart){
        chart.selectAll('rect').on('click.custom', function(d){
            var chartI = dc.chartRegistry.list('organismfeatures_group');
            var table = $('#features-datatable').DataTable();
            var rows = $("#features-datatable").dataTable()._('tr');
            for (var r = 0; r < rows.length; r++){
                if (rows[r][0] === d.x){
                    var indexes = table.rows().eq( 0 ).filter( function (rowIdx) {
                        return table.cell( rowIdx, 0 ).data() === d.x ? true : false;
                    });
                    if (table.rows(indexes).nodes().to$().hasClass('selected') === false){
                        table.rows(indexes)
                             .nodes()
                             .to$()
                             .addClass('selected');
                        console.log(rows[r], indexes);
                    } else {
                        table.rows(indexes)
                             .nodes()
                             .to$()
                             .removeClass('selected');
                    }
                }
            }
            for (var i = 0; i < chartI.length; i++) {
                if (chartI[i].chartName !== 'customHistogram1'){
                    chartI[i].filter(d.x);
                    console.log(chartI[i].chartName);
                }
            }
            dc.renderAll();
            console.log(d.x + "thing" + chartI);
        });
    });
    customHistogram1.chartName = 'customHistogram1';
    dc.chartRegistry.register(customHistogram1, 'organismfeatures_group');
    dc.renderAll();
    create_sunburst();

function create_icicle(){
    var dw = 1000,
        dh = 800,
        x = d3.scale.linear().range([0, dw]),
        y = d3.scale.linear().range([0, dh]);
    var vis = d3.select('#partition_display').append('svg')
                .attr("width", dw)
                .attr("height", dh);
    var partition = d3.layout.partition()
                      .value(function(d) { return d.count; });
    var colors = d3.scale.category20c();
    createchart(partition_data);

    function createchart(root) {
        var g = vis.selectAll("g")
          .data(partition.nodes(root))
          .enter().append("svg:g")
          .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
          .on("click", zoom);

        var kx = dw / root.dx,
            ky = dh;

        g.append("svg:rect")
          .attr("width", root.dy * kx)
          .attr("height", function(d) { return d.dx * ky; })
          .attr("fill", function(d) {if (d.color){console.log(d.color + ' ' + taxonChroma.get(d.color));return taxonChroma.get(d.color)};return colors(d.name)})

        g.append("svg:text")
          .attr("transform", transform)
          .style("opacity", function(d) { return d.dx * ky < 15 ? 0 : 1 })
          .style("font-size", function(d) { console.log(d.dy, d.y, d.dx, d.x, d.dy * 100 / d.name.length + 'rem');return d.dx > 0.06 ? "1em" : "1rem";return "1em";})
          .text(function(d) { if (d.parent){console.log(ancestors(d));};if(d.count){return d.name + ':' + d.number};if(d.name){return d.name; }})

        d3.select("#partition_display")
          .on("click", function() { zoom(root); })

        function zoom(d) {
            console.log('clicked');
            if (!d.children){ reset_all(); return};
            kx = (d.y ? dw - 40 : dw) / (1 - d.y);
            var crums = d.name;
            if (d.parent){
                crums = ancestors(d);
                $('.counter').html(crums.join('/'));
            } else {
                $('.counter').html('At ROOT LEVEL Organisms');
            }
            console.log(crums);
            ky = dh / d.dx;
            x.domain([d.y, 1]).range([d.y ? 40 : 0, dw]);
            y.domain([d.x, d.x + d.dx]);
            var t = g.transition()
                     .duration(500)
                     .attr("transform",
                      function(d) {
                          return "translate(" + x(d.y) + "," + y(d.x) + ")";
                      });
            t.select("rect")
             .attr("width", d.dy * kx)
             .attr("height", function(d) { return d.dx * ky; });

            t.select("text")
             .attr("transform", transform)
             .style("opacity", function(d) { return d.dx * ky < 15 ? 0 : 1 });

            d3.event.stopPropagation();
            var searchstr = "";
            var s = [];
            global_domain_filter = {};
            var table = $('#features-datatable').DataTable();
            var chartI = dc.chartRegistry.list('organismfeatures_group');
            if (d.depth === 0){
                reset_all();return
            }
            if (d.depth === 1){
                for (var i=0;i<d.children.length;i++){
                    var cstep = d.children[i]
                    for (var j=0;j<cstep.children.length;j++){
                        global_domain_filter[cstep.children[j].name] = 1;
                        if (searchstr.length < 1){
                            searchstr = '(' + cstep.children[j].name + ')[^\\S+]';
                        } else {
                            searchstr += '|(' + cstep.children[j].name + ')[^\\S+]';
                        }
                    }
                }
            }
            if (d.depth === 2){
                for (var i=0;i<d.children.length;i++){
                    global_domain_filter[d.children[i].name] = 1;
                    if (searchstr.length < 1){
                        searchstr = '(' + d.children[i].name + ')[^\\S+]';
                    } else {
                        searchstr += '|(' + d.children[i].name + ')[^\\S+]';
                    }
                }
            }
            if (d.depth === 3){
                searchstr = '(' + d.name + ')[^\\S+]';
                global_domain_filter[d.name] = 1;
            }
            table.search(searchstr, 1, true, true).draw();
            var rows = $("#features-datatable").dataTable()._('tr', {"filter": "applied"});
            for (i=0;i<rows.length;i++){
                s.push(rows[i][0]);
            }
            var len = s.length;
            w = (len * 30) + left_margin + 60;
            var all_filters = generateFilters(organismFeatures, global_domain_filter);
            for (var i = 0;i<chartI.length; i++){
                var count = 0;
                chartI[i].width(w);
                chartI[i].x(d3.scale.ordinal().domain(s));
                for (var j=0;j<features_filter.length;j++){
                    var key = features_filter[j];
                    if (count === 0){
                        chartI[i].group(all_filters[key], histogramSelection[key]);
                    } else {
                        chartI[i].stack(all_filters[key], histogramSelection[key]);
                    }
                    count++;
                }
                chartI[i].filter(null);
            }
            table.rows('.selected').deselect();
            dc.renderAll();
        }
        function transform(d) {
            return "translate(8," + d.dx * ky / 2 + ")";
        }
    }
}
function create_sunburst(){
    var width = 1000,
        height = 1000,
        pi = Math.PI,
        r = Math.min(width, height) / 2;

    var x = d3.scale.linear()
        .range([0, 2 * pi]);

    var y = d3.scale.linear()
        .range([0, r]);

    var svg = d3.select('#partition_display').append('svg')
        .attr("width", width)
        .attr("height", height)
        .append("g")
          .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

    var arc = d3.svg.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * pi, x(d.x))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * pi, x(d.x + d.dx))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

    var partition = d3.layout.partition()
                             .value(function(d) { return d.count; });
    var colors = d3.scale.category20c();
    createchart(partition_data);

    function createchart(root) {
        var g = svg.selectAll("g")
          .data(partition.nodes(root))
          .enter().append("g");

        var path = g.append("path")
          .attr("d", arc)
          .style("fill", function(d) { if (d.color){return taxonChroma.get(d.color)};return colors(d.name);})
          .on("click", zoom);

        var text = g.append("text")
          .attr("x", function(d) { return y(d.y); })
          .attr("transform", function(d) { return "rotate(" + rotateText(d) + ")"; })
          .style("font-size", function(d) {return d.dx > 0.06 ? "1em" : "1rem";return "1em";})
          .text(function(d) { var name = d.name;var twidth = (d.dy*width/2)/7;if(d.name.length >= twidth){name = d.name.substring(0, Math.ceil(twidth)) + "...";};if(d.count){return name + ':' + d.number};if(d.name){return name; }});
    d3.select("#partition_display")
          .on("click", function() { zoom(root); });
    // Free code from Metmajer's Zoomable Sunburst Example MIT license
        function zoom(d) {
            text.attr("opacity", 0);
            if (!d.children){ reset_all(); return};
            path.transition()
              .duration(350)
              .attrTween("d", arcTween(d))
              .each("end", function(e, i) {
              // check if the animated element's data e lies within the visible angle span given in d
                  if (e.x >= d.x && e.x < (d.x + d.dx)) {
                      // get a selection of the associated text element
                      var arcText = d3.select(this.parentNode).select("text");
                      // fade in the text element and recalculate positions
                      arcText.transition().duration(350)
                          .attr("opacity", 1)
                          .attr("transform", function() { return "rotate(" + rotateText(e) + ")" })
                          .attr("x", function(d) { return y(d.y); })
                          .text(function(d) { var name = d.name;var twidth = (d.depth * 5) + (d.dy*width/2)/7;if(d.name.length >= twidth){name = d.name.substring(0, Math.ceil(twidth)) + "...";};if(d.count){return name + ':' + d.number};if(d.name){return name; }});
                  }
              });
            d3.event.stopPropagation();
            //Controlls for table and figures
            var searchstr = "";
            var s = [];
            global_domain_filter = {};
            var table = $('#features-datatable').DataTable();
            var chartI = dc.chartRegistry.list('organismfeatures_group');
            if (d.depth === 0){
                reset_all();return
            }
            if (d.depth === 1){
                for (var i=0;i<d.children.length;i++){
                    var cstep = d.children[i]
                    for (var j=0;j<cstep.children.length;j++){
                        global_domain_filter[cstep.children[j].name] = 1;
                        if (searchstr.length < 1){
                            searchstr = '(' + cstep.children[j].name + ')[^\\S+]';
                        } else {
                            searchstr += '|(' + cstep.children[j].name + ')[^\\S+]';
                        }
                    }
                }
            }
            if (d.depth === 2){
                for (var i=0;i<d.children.length;i++){
                    global_domain_filter[d.children[i].name] = 1;
                    if (searchstr.length < 1){
                        searchstr = '(' + d.children[i].name + ')[^\\S+]';
                    } else {
                        searchstr += '|(' + d.children[i].name + ')[^\\S+]';
                    }
                }
            }
            if (d.depth === 3){
                searchstr = '(' + d.name + ')[^\\S+]';
                global_domain_filter[d.name] = 1;
            }
            table.search(searchstr, 1, true, true).draw();
            var rows = $("#features-datatable").dataTable()._('tr', {"filter": "applied"});
            for (i=0;i<rows.length;i++){
                s.push(rows[i][0]);
            }
            var len = s.length;
            w = (len * 30) + left_margin + 60;
            var all_filters = generateFilters(organismFeatures, global_domain_filter);
            for (var i = 0;i<chartI.length; i++){
                var count = 0;
                chartI[i].width(w);
                chartI[i].x(d3.scale.ordinal().domain(s));
                for (var j=0;j<features_filter.length;j++){
                    var key = features_filter[j];
                    if (count === 0){
                        chartI[i].group(all_filters[key], histogramSelection[key]);
                    } else {
                        chartI[i].stack(all_filters[key], histogramSelection[key]);
                    }
                    count++;
                }
                chartI[i].filter(null);
            }
            table.rows('.selected').deselect();
            dc.renderAll();
        }
    }
    d3.select("#partition_display").style("height", height + "px");

    function rotateText(d) {
        return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
    }
    // Free code from Metmajer's Zoomable Sunburst Example MIT license
    // Interpolate the scales!
    function arcTween(d) {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, r]);
        return function(d, i) {
            return i
                ? function(t) { return arc(d); }
                : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
        };
    }
}
    $("#reset-features").click(reset_all);

    function reset_all(){
        var d = partition_data;
        var width = 1000,
            height = 1000,
            r = Math.min(width, height) / 2;

        var x = d3.scale.linear()
            .range([0, 2 * Math.PI]);

        var y = d3.scale.linear()
            .range([0, r]);

        var table = $('#features-datatable').DataTable();
        var chartI = dc.chartRegistry.list('organismfeatures_group');
        table.rows('.selected').deselect();
        table.search("").draw();
        var len = $("#features-datatable").dataTable()._('tr').length;
        var w = len * 30 + left_margin + 60;
        global_domain_filter = {};
        var all_filters = generateFilters(organismFeatures, global_domain_filter);
        for (var i = 0;i<chartI.length; i++){
            var count = 0;
            chartI[i].width(w);
            chartI[i].x(d3.scale.ordinal().domain(ordering));
            for (var j=0;j<features_filter.length;j++){
                var key = features_filter[j];
                if (count === 0){
                    chartI[i].group(all_filters[key], histogramSelection[key]);
                } else {
                    chartI[i].stack(all_filters[key], histogramSelection[key]);
                }
                count++;
            }
            chartI[i].filter(null);
        }
        dc.renderAll();

        dc.redrawAll();
        table.clear();
        table.rows.add(feature_table_data).order([]).draw();
    }

    $('#display_sunburst').on('click', function(){
        var svgs = d3.select('svg').remove();
        sunburst_on = 1;
        create_sunburst();
    });

    $('#display_icicle').on('click', function(){
        var svgs = d3.select('svg').remove();
        sunburst_on = 0;
        create_icicle();
    });

    $('#origin_genus').on('click', function(){
        partition_data = {'name' : 'Genus', 'children' : []};
        var tmp_data = {};
        for(var i=0;i<feature_table_data.length;i++){
           var tmp_vals = feature_table_data[i];
           var genus = tmp_vals[3];
           var origin = tmp_vals[1];
           var datum = {'color' : tmp_vals[3]+ ' ' +tmp_vals[4], 'name': tmp_vals[0], 'children': [{'count': 1, 'name': 'Genes', 'number': tmp_vals[14]}, {'count': 1, 'name': 'mRNAs', 'number': tmp_vals[15]}, {'count': 1, 'name': 'Exons', 'number': tmp_vals[16]}, {'count': 1, 'name': 'Polypeptides', 'number': tmp_vals[17]}, {'count': 1, 'name': 'LGs', 'number': tmp_vals[8]}, {'count': 1, 'name': 'Chromosomes', 'number': tmp_vals[6]}, {'count': 1, 'name': 'Genetic Markers', 'number': tmp_vals[9]}, {'count': 1, 'name': 'Scaffolds', 'number': tmp_vals[7]}]};
           if (genus in tmp_data){
               if (origin in tmp_data[genus]){
                   tmp_data[genus][origin].push(datum);
               } else{
                   tmp_data[genus][origin] = [datum];
               }
           } else {
               tmp_data[genus] = {};
               tmp_data[genus][origin] = [datum];
           }
        }
        for (var k in tmp_data){
            var g_ins = {'name' : k, 'children' : [], 'color' : k + ' 0'};
            for (var y in tmp_data[k]){
                var d_ins = {'name' : y, 'children' : tmp_data[k][y], 'color' : k + ' 1000'};
                g_ins['children'].push(d_ins);
            }
            partition_data['children'].push(g_ins);
        }
        var ptitle = d3.select('#partition_title');
        ptitle.text('Patition Display of Ontological Features by Genus')
        var svgs = d3.select('svg').remove();
        if(sunburst_on === 1){
            create_sunburst();
        } else {
            create_icicle();
        }
    });
    
    $('#origin_db').on('click', function(){
        partition_data = {'name' : 'Origin', 'children' : []};
        var tmp_data = {};
        for(var i=0;i<feature_table_data.length;i++){
           var tmp_vals = feature_table_data[i];
           var genus = tmp_vals[3];
           var origin = tmp_vals[1];
           var datum = {'color' : tmp_vals[3]+ ' ' +tmp_vals[4], 'name': tmp_vals[0], 'children': [{'count': 1, 'name': 'Genes', 'number': tmp_vals[14]}, {'count': 1, 'name': 'mRNAs', 'number': tmp_vals[15]}, {'count': 1, 'name': 'Exons', 'number': tmp_vals[16]}, {'count': 1, 'name': 'Polypeptides', 'number': tmp_vals[17]}, {'count': 1, 'name': 'LGs', 'number': tmp_vals[8]}, {'count': 1, 'name': 'Chromosomes', 'number': tmp_vals[6]}, {'count': 1, 'name': 'Genetic Markers', 'number': tmp_vals[9]}, {'count': 1, 'name': 'Scaffolds', 'number': tmp_vals[7]}]};
           if (origin in tmp_data){
               if (genus in tmp_data[origin]){
                   tmp_data[origin][genus].push(datum);
               } else{
                   tmp_data[origin][genus] = [datum];
               }
           } else {
               tmp_data[origin] = {};
               tmp_data[origin][genus] = [datum];
           }
        }
        for (var k in tmp_data){
            var d_ins = {'name' : k, 'children' : []};
            for (var y in tmp_data[k]){
                var g_ins = {'name' : y, 'children' : tmp_data[k][y], 'color' : y + ' 0'};
                d_ins['children'].push(g_ins);
            }
            partition_data['children'].push(d_ins);
        }
        console.log('my datastructure ' + JSON.stringify(partition_data));
        var ptitle = d3.select('#partition_title');
        ptitle.text('Patition Display of Ontological Features by DB')
        var svgs = d3.select('svg').remove();
        if(sunburst_on === 1){
            create_sunburst();
        } else {
            create_icicle();
        }
    });

    $('#features-datatable tbody').on('click', 'tr', function(){
        var chartI = dc.chartRegistry.list('organismfeatures_group');
        var rows = $('#features-datatable').DataTable().rows('.selected').data();
        var filtered_samples = organismFeatures.top(Infinity);
        for (var j = 0;j<chartI.length; j++){
            chartI[j].filter(null);
            for (var i = 0;i<rows.length; i++){
                chartI[j].filter(rows[i][0]);
            }
        }
        dc.redrawAll();
    });

    $('#features-datatable thead').on('click', 'th', function(){
        var s = [];
        var chartI = dc.chartRegistry.list('organismfeatures_group');
        var rows = $("#features-datatable").dataTable()._('tr', {"filter": "applied"});
        for (var i = 0;i<rows.length;i++){
            s.push(rows[i][0]);
        }
        for (var i = 0;i<chartI.length; i++){
            chartI[i].x(d3.scale.ordinal().domain(s));
        }
        dc.redrawAll();
    });

    $("#features-datatable_filter input").on('keyup', function(k){
        var rows = $("#features-datatable").dataTable()._('tr', {"filter": "applied"});
        var chartI = dc.chartRegistry.list('organismfeatures_group');
        var s = [];
        global_domain_filter = {};
        for (var i = 0;i<rows.length;i++){
            s.push(rows[i][0]);
            global_domain_filter[rows[i][0]] = 1;
        }
        var len = rows.length;
        w = (len * 30) + left_margin + 60;
        var all_filters = generateFilters(organismFeatures, global_domain_filter);
        for (var i = 0;i<chartI.length; i++){
            var count = 0;
            chartI[i].width(w);
            chartI[i].x(d3.scale.ordinal().domain(s));
            for (var j=0;j<features_filter.length;j++){
                var key = features_filter[j];
                if (count === 0){
                    chartI[i].group(all_filters[key], histogramSelection[key]);
                } else {
                    chartI[i].stack(all_filters[key], histogramSelection[key]);
                }
                count++;
            }
        }
        dc.renderAll();
    });

    $("#filter-features").on('click' , function(e){
        var rows = $('#features-datatable').DataTable().rows('.selected').data();
        var chartI = dc.chartRegistry.list('organismfeatures_group');
        var table = $('#features-datatable').DataTable();
        var s = [];
        var r = {};
        var searchstr = "";
        global_domain_filter = {};
        var len = rows.length;
        w = (len * 30) + left_margin + 60;
        if (rows.length === 0){
            return 0;
        }
        for (var i=0;i<rows.length;i++){
            s.push(rows[i][0]);
            global_domain_filter[rows[i][0]] = 1;
            if (searchstr.length < 1){
                searchstr = '(' + rows[i][0] + ')[^\\S+]';
            } else {
                searchstr += '|(' + rows[i][0] + ')[^\\S+]';
            }
        }
        table.search(searchstr, 1, true, true).draw();
        var all_filters = generateFilters(organismFeatures, global_domain_filter);
        for (var i = 0;i<chartI.length; i++){
            var count = 0;
            chartI[i].width(w);
            chartI[i].x(d3.scale.ordinal().domain(s));
            for (var j=0;j<features_filter.length;j++){
                var key = features_filter[j];
                if (count === 0){
                    chartI[i].group(all_filters[key], histogramSelection[key]);
                } else {
                    chartI[i].stack(all_filters[key], histogramSelection[key]);
                }
                count++;
            }
            chartI[i].filter(null);
        }
        table.rows('.selected').deselect();
        dc.renderAll();
    });

    $('button.customfilters').on('click', function(e){
        var element = 'input.customfilters-' + $(this).attr('id').split('-')[1];
        var rows = $("#features-datatable").dataTable()._('tr', {"filter": "applied"});
        var chartI = dc.chartRegistry.list('organismfeatures_group');
        var s = [];
        global_domain_filter = {};
        for (var i = 0;i<rows.length;i++){
            s.push(rows[i][0]);
            global_domain_filter[rows[i][0]] = 1;
        }
        var len = rows.length;
        w = (len * 30) + left_margin + 60;
        var all_filters = generateFilters(organismFeatures, global_domain_filter);
        for (var i = 0;i<chartI.length; i++){
            var count = 0;
            chartI[i].width(w);
            chartI[i].x(d3.scale.ordinal().domain(s));
            for (var j=0;j<features_filter.length;j++){
                var key = features_filter[j];
                if (count === 0){
                    chartI[i].group(all_filters[key], histogramSelection[key]);
                } else {
                    chartI[i].stack(all_filters[key], histogramSelection[key]);
                }
                count++;
            }
        }
       dc.renderAll();
    });

    $('input[type=checkbox]').change(function(){
        console.log('my bool ' + this.checked + 'this val ' + $(this).attr('value'));
        var datum = $(this).attr('value');
        var graph_number = $(this).attr('class').split('-')[1];
        console.log('my chart number ' + graph_number);
        if (this.checked){
            var index = features_filter.indexOf(datum);
            if (index !== -1){
                features_filter.splice(index, 1);
            }
            features_filter.push(datum);
        } else {
            var index = features_filter.indexOf(datum);
            if (index !== -1){
                features_filter.splice(index, 1);
            }
        }
        console.log('my filter ' + features_filter);
    });

    $('a.toggle-vis').on('click', function(e){
        e.preventDefault();
        var column = $("#features-datatable").DataTable().column(':contains(' + $(this).attr('data-column') + ')');
        column.visible(! column.visible());
        color_anchors($(this));
    });
});
