var lambda_sites = {
	"PL": {
		short: "Left promoter",
		long: "",
		start: 0,
		end: 0
 	},
	"PR": {
		short: "Right promoter",
		long: "",
		start: 0,
		end: 0
	},
	"PRPrime": {
		short: "Second right promoter",
		long: "",
		start: 0,
		end: 0
	},
	"OL": {
		short: "Operator for leftward transcription, binding sites for CI and Cro repressors",
		long: "",
		start: 0,
		end: 0
	},
	"OR": {
		short: "Operator for rightward transcription, binding sites for CI and Cro repressors"
	},
	"tL1": {
		short: "First termination site of leftward transcription"
	},
	"tL2": {
		short: "Second termination site of rightward transcription"
	},
	"tR1": {
		short: "First termination site of leftward transcription"
	},
	"tR2": {
		short: "Second termination site of leftward transcription"
	},
	"tR3": {
		short: "Fifth termination site of leftward transcription"
	},
	"tR4": {
		short: "Fourth termination site of leftward transcription"
	},
	"tR1": {
		short: "Final termination site of leftward transcription"
	},
	"nutL": {
		short: "Right N utilization site",
		long: "N utilization site for leftward-transcribing RNA Pol. Sequence in the mRNA binds to N, allowing it to bind to RNA Pol and resist termination."
	},
	"nutR": {
		short: "Left N utilization site",
		long: "N utilization site for rightward-transcribing RNA Pol. Sequence in the mRNA binds to N, allowing it to bind to RNA Pol and resist termination."
	},
	"qut": {
		short: "Q utilization site.",
		long: "site where the protein Q binds"
	},
	"pRE":{
		short: "Promoter for repressor estabilishment",
		long: ""
	},
	"pRM": {
		short: "Promoter for repressor maintinance",
	},
	"pi": {
		short: "int promoter",
		long: ""
	},
	"POP": {
		short: "attachment site for integration into the genome"
	},
	"cos":{
		short: "cohesive ends of lambda genome.",
		long: "complimentary 12 bp single stranded ends of the linear genome which anneal to form a circular genome after infection."
	}
}


//all concentration are in micromolar.
var lambda_gene_products = {
	"N": {
		short: "",
		long: "",
		locus_tag: "lambdap49",
	},
	"O": {
		short: "",
		long: "",
		locus_tag: "lambdap89",
	},
	"P": {
		short: "DNA replication protein",
		long: "",
		locus_tag: "lambdap61",
	},
	"Q": {
		short: "antitermination protein",
		long: "Q loads onto RNA polymerase at qut (Q utilization site) and prevents termination at a downstream terminator.",
		locus_tag: "lambdap71",
	},
	"CI": {
		short: "repressor",
		long: "",
		locus_tag: "lambdap88",
	},
	"CII": {
		short: "lysogeny transcription activator",
		long: "",
		locus_tag: "lambdap59",
	},
	"CIII": {
		short: "CII stabilizer",
		long: "",
		locus_tag: "lambdap86",
	},
	"Cro":
	{
		short: "repressor of CI synthesis",
		long: "",
		locus_tag: "lambdap57",
	},
	"Gam":
	{
		short: "recBCD inhibitor",
		long: "The cellular exonuclease recBCD will chew up the ends of linear double-stranded DNA during rolling cycle replication, so lambda makes Gam, which binds to recBCD and inhibits its activity.",
		locus_tag: "lambdap42",
	},
	"int":
	{
		short: "integrase",
		long: "", 
		locus_tag: "lambdap33",
	},
	"xis": {
		short: "excisease and dirctionality factor",
		long: "",
		locus_tag: "lambdap31",
	},
	"ral": {
		short: "",
		long: "",
		locus_tag: "lambdap46",
	}
}

var cellular_enzymes = {
	'rnap': {
		start_level: 2.5
	},
	'dnap': {
		start_level: 0.1 // made up number
	},
	'recBCD': {
		start_level: 0
	}
}

var cell_health;
var scale;
var lambda_genome;
var t = 0;
var speed = 1;
var speed_multiplier = 5;
var last_step_time = new Date().getTime(); // the time in milliseconds that the last step was taken
var phage_locations = [];
var phage_genomes = [];
var phage_speed = 0.25;

function start_lambda() {
	Object.keys(lambda_gene_products).map(function(k){lambda_gene_products[k].level=0;});
	Object.keys(cellular_enzymes).map(function(k){cellular_enzymes[k].level=cellular_enzymes[k].start_level;});
	lambda_product_sliders = d3.select('#gene-products').selectAll()
		.data(Object.keys(lambda_gene_products).concat(Object.keys(cellular_enzymes))).enter()
			.append("div")
				.attr("class", 'gene-product')
				.attr("name", function(d){return d;});
	lambda_product_sliders.append("h2")
		.text(function(d){return d;});
	lambda_product_sliders.append("div")
		.attr("class", "gene-product-slider")
		.attr("name", function(d){return d;});
	$('.gene-product-slider').each(function(){
		$(this).slider();
	});
	$('.gene-product-slider').each(function(){
		$(this).slider("option", "stop", function(event, ui){
			set_gene_product_lvl(ui.handle.parentElement.parentElement.__data__, ui.value);
		})
	});
	$('.speed-control').on('click', function(e){change_speed($(e.target).attr('speed'));});
	lambda_genome = $.ajax({
		type: "GET",
		url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nuccore&id=NC_001416.1&version=2.0",
		dataType: "xml",
		success: function(response){
			
		}
	});
	$('.lambda-element').each(function(){
		$(this).on('mouseover', on_mouse_over_element);
	})
	window.setInterval(step, 10);
	on_resize();
}

function on_resize() {
	var w = $('#canvas').width();
	var h = parseInt(w * 4 / 5);
	$("#info-box").css("height", h);
	$("#control-box").css("height", h);
	scale = d3.scaleLinear().domain([0, 1200]).range([0, w]);
	// scale should also scale 0 - 800 to 0 - h

	$("#controlbox").css('height', h);
	$('#canvas').attr('height', h);
	draw_cell({x: 600, y: 600}, 500);
}

function on_mouse_over_element() {
	$("#sel-obj-name").text($(this).attr("name"));
	$("#sel-obj-description").text(get_element_description($(this).attr("name")));
}

function get_element_description(element_name)
{
	return "description for " + element_name; //placheolder
}

function draw_cell(center, r) {
	d3.select('#cell')
		.attr('cx', scale(center.x))
		.attr('cy', scale(center.y))
		.attr('rx', scale(r))
		.attr('ry', scale(r * 2 / 3))
		.attr('F', scale(Math.sqrt(r - (r * 2 / 3))));
	chr_r = 120;
	chr_center = {x: center.x -250, y: center.y}
	var chrpath1 = describeArc(chr_center.x, chr_center.y, chr_r, -90, 90);
	var chrpath2 = describeArc(chr_center.x, chr_center.y, chr_r, 90, -90);
	path = "M " + scale(chr_center.x - chr_r) + " " + scale(chr_center.y) + " " + chrpath1 + " " + chrpath2;
	d3.select('#chromasome')
		.attr('d', path);
}

function set_gene_product_lvl(product, lvl) {
	var selector = $('.gene-product-slider[name="'+product+'"]');
	if (selector.slider("option", "value") != lvl) {
		selector.slider("option", "value", lvl);
	}
	lambda_gene_products[product].level = lvl;
}

function add_phage()
{
	var start = {x: Math.random() * scale.domain()[1], y: 0, landed: false};
	phage_locations = phage_locations.concat(start);
	phage_genomes = phage_genomes.concat({parent_location_index: phage_locations.length-1})
	draw_lambda_phage(start);
}

function draw_lambda_phage(point)
{
	phage_outer = d3.select('#canvas').append("g")
		.attr("class", "lambda-element phage-capsid");
	phage_g = phage_outer.append('g');

	//draw capsid
	var capsid_points = [
		{x: 4, y: 0},
		{x: 8, y: 2},
		{x: 8, y: 6},
		{x: 4, y: 8},
		{x: 0, y: 6},
		{x: 0, y: 2}
	];
	var capsid_triangle_points = [
		capsid_points[0],
		capsid_points[2],
		capsid_points[4]
	];																												
	midpoints = [
		midpoint(capsid_triangle_points[0], capsid_triangle_points[1]),
		midpoint(capsid_triangle_points[1], capsid_triangle_points[2]),
		midpoint(capsid_triangle_points[2], capsid_triangle_points[0])
	];
	head = phage_g.append("g")
		.attr('class', 'phage-capsid-head')
		.attr('name', 'Head');
	head.append('polygon')
		.attr('points', capsid_points.map(p => scale(p.x) + "," + scale(p.y)).join(" "))
	head.append('polygon')
		.attr('points', capsid_triangle_points.map(p => scale(p.x) + "," + scale(p.y)).join(" "))
		.style('fill', 'none');
	head.append('polygon')
		.attr('points', midpoints.map(p => scale(p.x) + "," + scale(p.y)).join(" "))
		.style('fill', 'none');
	append_line_between(head, midpoints[0], capsid_points[1]);
	append_line_between(head, midpoints[1], capsid_points[3]);
	append_line_between(head, midpoints[2], capsid_points[5]);
	//draw tail
	tail = phage_g.append('g')
		.attr('class', 'phage-capsid-tail')
		.attr('name', "Tail");
	tail.append('ellipse')
		.attr('name', 'collar')
		.attr('cx', scale(capsid_points[3].x))
		.attr('cy', scale(capsid_points[3].y))
		.attr('rx', scale(1.2))
		.attr('ry', scale(0.5));
	var tail_len = 20;
	var tail_div = 0.5;
	tail.append('rect')
		.attr('name', 'tail')
		.attr('x', scale(capsid_points[3].x - 0.5))
		.attr('y', scale(capsid_points[3].y + 0.5))
		.attr('width', scale(0.8))
		.attr('height', scale(tail_len * tail_div));

	tail.selectAll('line.tail-prots').data([...Array(20).keys()]).enter()
		.append('line')
			.attr('x1', scale(capsid_points[3].x - 0.4))
			.attr('x2', scale(capsid_points[3].x + 0.4))
			.attr('y1', function(d){return scale(capsid_points[3].y + (1.0 + tail_div * d));})
			.attr('y2', function(d){return scale(capsid_points[3].y + (1.0 + tail_div * d));})
			.attr('class', 'tail-prots');
	var baseplate_y = capsid_points[3].y + (tail_len * tail_div + 0.5);
	var tail_fibers = [
		[
			{x: 0, y: 0.5},
			{x: 2, y: -4},
			{x: 4, y: 0.5}
		],
		[
			{x: 0, y: 0.5},
			{x: 3, y: -4},
			{x: 6, y: 0.5}
		],
		[
			{x: 0, y: 0.5},
			{x: 4, y: -4},
			{x: 8, y: 0.5}
		]
	];
	tail_fibers = tail_fibers.concat(tail_fibers.map(a => 
		a.map(p => 
			Object({
				x: -p.x,
				y: p.y
			})
		)
	));
	tail_fibers = tail_fibers.map(a => 
		a.map(p => 
			Object({
				x: p.x + capsid_points[3].x,
				y: p.y + baseplate_y
			})
		)
	);
	
	tail.selectAll('.tail-fiber').data(tail_fibers).enter().append('polyline')
		.attr('class', 'tail-fiber')
		.attr('name', 'Tail Fiber')
		.attr('points', function(d){return d.map(p => scale(p.x) + "," + scale(p.y)).join(" ")})
		.style('fill', 'none');
	tail.append('ellipse')
		.attr('cx', scale(capsid_points[3].x))
		.attr('cy', scale(baseplate_y))
		.attr('rx', scale(1))
		.attr('ry', scale(0.8))
		.attr('class', 'capsid-baseplate')
		.attr('name', 'Baseplate');

	var capsid_scale = 8;
	var inner_translate = 'translate(' + (-scale(4)) + ' ' + (-scale(baseplate_y * capsid_scale)) + ') scale(' + capsid_scale + ' ' + capsid_scale + ')'
	
	var genome = d3.select("#canvas").append('path')
		.classed('lambda-genome', true)
		.classed('capsid', true)
		.attr('name', 'Genome')
		.attr('d', draw_phage_genome(4, -baseplate_y, d3.scaleLinear().domain([0,8]).range([0, 8 * capsid_scale]), 'capsid', 2));
	phage_g.attr('transform', inner_translate);
	var rotation = Math.atan2(point.y - scale.invert($('#cell').attr('cy')), point.x - scale.invert($('#cell').attr('cx'))) * 360 / (2 * Math.PI) + 90;
	genome.attr('transform', "translate(" + scale(point.x) + "  " + scale(point.y) + ") rotate(" + rotation + ")");
	phage_outer.attr('transform', "translate(" + scale(point.x) + "  " + scale(point.y) + ") rotate(" + rotation + ")");
}

function draw_phage_genome(x, y, gscale, form, num_curves)
{
	if (form == 'capsid')
	{
		var len = gscale.domain()[1] * .8;
		var genome_path = d3.path();
		// y = y + gscale.domain()[1] * .1;
		genome_path.moveTo(scale(gscale(x)), scale(gscale(y)));
		for (var i = 0; i < num_curves; i++){
			this_pt = gscale((y + (i + 1) * len / num_curves));
			last_pt = gscale((y + i * len / num_curves));
			focal_x = gscale(x + 2 * (1 - 2 * (i % 2)));
			genome_path.quadraticCurveTo(scale(focal_x), scale((last_pt + this_pt) / 2), scale(gscale(x)), scale(this_pt));
		}
	}
	else if (form == 'linear')
	{
		var len = gscale.domain()[1] * .8;
		var genome_path = d3.path();
		// y = y + gscale.domain()[1] * .1;
		genome_path.moveTo(scale(gscale(x)), scale(gscale(y)));
		for (var i = 0; i < num_curves; i++){
			this_pt = gscale((y + (i + 1) * len / num_curves));
			last_pt = gscale((y + i * len / num_curves));
			focal_x = gscale(x)
			genome_path.quadraticCurveTo(scale(focal_x), scale((last_pt + this_pt) / 2), scale(gscale(x)), scale(this_pt));
		}
	}
	else if (form == 'circular')
	{

	}
	return genome_path.toString();
}

function append_log(message)
{
	$('#event-log').prepend($('<br>'));
	$('#event-log').prepend(message);
}

function change_speed(new_speed)
{
	if (speed != 0)
		step();
	speed = new_speed * speed_multiplier;
}

function step() {
	if (speed == 0)
		return;
	var dsteps = (new Date().getTime() - last_step_time) * speed;
	var cell_center = {x: scale.invert($('#cell').attr('cx')), y: scale.invert($('#cell').attr('cy'))};
	var cell_axes = {
			x: scale.invert($('#cell').attr('rx')),
			y: scale.invert($('#cell').attr('ry'))
		};
	d3.selectAll('.phage-capsid').data(phage_locations).transition()
		.duration(100)
		.attr('transform', function(d, i){
			var theta = -Math.atan2(d.y - cell_center.y, d.x - cell_center.x);
			
			var cell_border = {
				x: cell_center.x + cell_axes.x * Math.cos(-theta),
				y: cell_center.y + cell_axes.y * Math.sin(-theta)
			}
			// if (cell_border.x >= d.x || cell_border.y >= d.y)
			if (d.landed == false)
			{
				var dx = -(phage_speed * dsteps) * Math.cos(theta);
				var dy = (phage_speed * dsteps) * Math.sin(theta);
				d.x = d.x + dx;
				d.y = d.y + dy;
				if (Math.pow(d.x - cell_center.x, 2) / Math.pow(cell_axes.x, 2) + Math.pow(d.y - cell_center.y, 2) / Math.pow(cell_axes.y, 2) < 1)
				{
					append_log('Attachment');
					d.landed = true;
				}
			}
			return "translate(" + scale(d.x) + " " + scale(d.y) + ") rotate(" + (-theta * 360 / (Math.PI * 2) + 90) + ")";
		});
	var notlanded = d3.selectAll('.lambda-genome.capsid').data(phage_genomes.filter(g => !g.landed));
	notlanded.transition().duration(100)
		.attr('transform', function(d, i){
			return $($(".phage-capsid").get(d.parent_location_index)).attr('transform')
;
		})
		.attr('d', function(d, i) {
			return $(this).attr('d');
		});
	var landed = d3.selectAll('.lambda-genome.landed').data(phage_genomes.filter(g => g.landed && !g.cytosol))
	landed.enter().classed('cytosol', true);
	landed.transition().duration(500)
		.attr('transform', function(d, i){
			return $(".phage-capsid").get(d.parent_location_index).attr('transform');		})
		.attr('d', function(d){
			d.cytosol = true;
			append_log('DNA Ejection');
			return draw_phage_genome(4, 4, d3.scaleLinear().domain([0,8]).range([0, 64]), 'linear', 2);
		});
	d3.selectAll('.lambda-genome.cytosol').data(phage_genomes.filter(g => g.cytosol)).transition()
		.duration(500)
		.attr('transform', function(d, i)
		{
			var transform = $(this).attr('transform');
			var translate, rotate = transform.split(' ');
			var x,y = translate.substring(translate.indexOf('(') + 1, translate.indexOf(')')).split(',');

		})
		.attr('d', function(d, i){
			return draw_phage_genome(4, 4, d3.scaleLinear().domain([0,8]).range([0, 64]), 'circular');
		});

	last_step_time = new Date().getTime();
	t = t + dsteps;
	$('#time').text(t);
}

function absmax(a, b){
	return Math.abs(a) > Math.abs(b) ? a : b;
}

function absmin(a, b){
	return Math.abs(a) < Math.abs(b) ? a : b;
}

function restrict_inside_cell(pt)
{
	var theta = Math.atan2(pt.y, pt.x);
	var cell_center = {x: scale.invert($('#cell').attr('cx')), y: scale.invert($('#cell').attr('cy'))};
	var cell_border = {x: Math.cos(theta) * cell_center.x, y: Math.sin(theta) * cell_center.y};
	return {x: absmin(pt.x, cell_border.x), y: absmin(pt.y, cell_border.y)};

}

function append_line_between(sel, p1, p2, do_scale=true)
{
	return sel.append('line')
		.attr('x1', do_scale ? scale(p1.x) : p1.x)
		.attr('x2', do_scale ? scale(p2.x) : p2.x)
		.attr('y1', do_scale ? scale(p1.y) : p1.y)
		.attr('y2', do_scale ? scale(p2.y) : p2.y);
}

function midpoint(p1, p2)
{
	return {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2}
}

//The following two functions found on Stack Overflow, written by user opsb
//scaling added by me
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle){

    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);

    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", scale(start.x), scale(start.y), 
        "A", scale(radius), scale(radius), 0, largeArcFlag, 0, scale(end.x), scale(end.y)
    ].join(" ");

    return d;       
}