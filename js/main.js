$(function() {
	d3.csv('data/prepped_data.csv', function(error, allData) {

        var city = "Seattle, WA";
        var type = "max";
        var originalType = type;

		var margin = {
			left: 70,
			bottom: 100,
			top: 50,
			right: 10
		};

		var height = 600;
		var width = 1200;

		var drawHeight = height - margin.bottom - margin.top;
		var drawWidth = width - margin.left - margin.right;

		var svg = d3.select("#vis")
			.append('svg')
			.attr('height', height)
			.attr('width', width);

		var g = svg.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
			.attr('height', drawHeight)
			.attr('width', drawWidth);

		var xAxisLabel = svg.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + (drawHeight + margin.top) + ')')
			.attr('class', 'axis');

		var yAxisLabel = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');

        var xAxisText = svg.append('text')
            .attr('transform', 'translate(' + (margin.left + drawWidth / 2) + ',' + (drawHeight + margin.top + 60) + ')')
            .attr('class', 'title');

        var yAxisText = svg.append('text')
            .attr('transform', 'translate(' + (margin.left - 40) + ',' + (margin.top + drawHeight / 2) + ') rotate(-90)')
            .attr('class', 'title');

        var xAxis = d3.axisBottom();
        var yAxis = d3.axisLeft();

        var xScale = d3.scaleTime();
        var yScale = d3.scaleLinear();

        // Parsing the date to the correct format
        var parseTime = d3.timeParse("%_m/%e");

        allData.forEach(function(d) {
                d.date = parseTime(d.date);
        });
        
        var setScales = function(data){
            xScale.range([0, drawWidth])
                .domain(d3.extent(data, function(d) { 
                    return d.date;
                }));

            // choose the y min and max value depends of what data the users want to see
            var yMin = d3.min(data, function(d) {
                return +d[type];
            });
            var yMax = d3.max(data, function(d) {
                return +d[type];
            });
            // Set the domain/range of your yScale
            yScale.range([drawHeight, 0])
                .domain([0, yMax]);
        };


        var setAxes = function(){
            // allow x axis to show date information
            xAxis.scale(xScale)
                .tickFormat(d3.timeFormat("%b-%d"))
                .ticks(d3.timeWeek);

            yAxis.scale(yScale);

            xAxisLabel.transition().duration(1500).call(xAxis);

            yAxisLabel.transition().duration(1500).call(yAxis);

            // different graph shows different x axis label
            if(originalType == "min/max") xAxisText.text('Date (Red: Max Temperature Blue: Min Temperature)');
            else xAxisText.text('Date');

            // different data shows different y axis label
            if(type == "precipitation") yAxisText.text('Precipitation(inch)');
            else yAxisText.text('Temperature (\xB0F)');

            xAxisLabel.selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');
        };

        var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
            var monthFormat = d3.timeFormat("%b-%d")
            if(type == "precipitation")
            return monthFormat(d.date) + " " + d[type] + " inches";
            else return monthFormat(d.date) + " " + d[type] + " \xB0F";
        });
        g.call(tip);

        // Function for drawing the bar chart
        var draw = function(data){
            // removes the line chart
            svg.selectAll("path").remove();
            svg.selectAll("dot").remove();
            svg.selectAll("circle").remove();
            
            // set scale, axes and draw the bar graph with the new data
            setScales(data);
            setAxes();
            var bars = g.selectAll('rect').data(data);
            bars.enter().append('rect')
                .attr('x', function(d) {
                    return xScale(d.date);
                })
                .attr('y', function(d){
                    return drawHeight;
                })
                .attr('height', 0)
                .attr('class', 'bar')
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .attr('width', width/data.length)
                .merge(bars)
                .transition()
                .duration(500)
                .delay(function(d){return xScale(d.date)})
                .attr('y', function(d) {
                    return yScale(d[type]);
                })
                .attr('height', function(d) {
                    return drawHeight - yScale(d[type]);
                })
                .style('fill', function(d){
                    return d3.schemeCategory20[d.date.getMonth()];
                });

            bars.exit().remove();
        };

        // Function for drawing the line chart
        var drawLine = function(data){
            // removet the current drawings on the page
            svg.selectAll("rect").remove();
            svg.selectAll("path").remove();
            svg.selectAll("dot").remove();
            svg.selectAll("circle").remove();


            setScales(data);
            setAxes();

            // Tip for both lines
            var lineTipMax = d3.tip().attr('class', 'd3-tip').html(function(d) {
                var monthFormat = d3.timeFormat("%b-%d")
                return monthFormat(d.date) + " Max Temp: " + d.max + " \xB0F";
            });
            g.call(lineTipMax);

            var lineTipMin = d3.tip().attr('class', 'd3-tip').html(function(d) {
                var monthFormat = d3.timeFormat("%b-%d")
                return monthFormat(d.date) + " Min Temp: " + d.min + " \xB0F";
            });
            g.call(lineTipMin);

            // Line with max temperature data
            var line = d3.line()
                .x(function(d) { return xScale(d.date); })
                .y(function(d) { return yScale(d.max); });
            var path = g.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "#d62728")
                .attr("stroke-width", 5)
                .attr("d", line);

            // append non-visible dots for the ability to hover
            var dots = svg.selectAll("dot")  
                .data(data)         
                .enter().append("circle")                               
                .attr("r", 1.5)       
                .attr("cx", function(d) { return (xScale(d.date) + margin.left); })       
                .attr("cy", function(d) { return (yScale(d.max) + margin.top); })  
                .style('opacity', 0)   
                .on("mouseover", lineTipMax.show)                  
                .on("mouseout", lineTipMax.hide);

            // line with min temperature data
            var line2 = d3.line()
                .x(function(d) { return xScale(d.date); })
                .y(function(d) { return yScale(d.min); });
            var path =g.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "#1f77b4")
                .attr("stroke-width", 5)
                .attr("d", line2);
            var dots = svg.selectAll("dot")  
                .data(data)         
                .enter().append("circle")                               
                    .attr("r", 1.5)       
                    .attr("cx", function(d) { return (xScale(d.date) + margin.left); })       
                    .attr("cy", function(d) { return (yScale(d.min) + margin.top); })
                    .attr('opacity', 0)     
                    .on("mouseover", lineTipMin.show)                  
                    .on("mouseout", lineTipMin.hide);
        }

        
        // filter data based on the city choice
        var filterData = function() {
            var currentData = allData.filter(function(d) {
                    return d.city == city
                });
            return currentData;
        };

        $("input").on('change', function(){
            var value = $(this).val();
            var isCity = $(this).hasClass('city');
            if(isCity) city = value;
            else type = value;

            var currentData = filterData();
            if(type == "min/max") {
                originalType = type;
                type = "max";
                drawLine(currentData);
                type = "min/max";
            }
            else {
                originalType = "max";
                draw(currentData);
            }
        });

        var currentData = filterData();
        draw(currentData);

	});
});