var TzaChart = function(){

    var me = {};
    var chart;
    var initDone = false;

    me.init = function(){
        document.getElementById("legend").innerHTML = Template.get("legendchart");
        initDone = true;
    };

    me.render = function(){
        if (!initDone) return;
        if (chart) chart = chart.destroy();

        var mines = Data.getFilteredMines();

        var max = Data.getMinesTotal();
        var current = mines.length;

        document.getElementById("chart_current").innerHTML = current.toLocaleString();
        document.getElementById("chart_total").innerHTML = max.toLocaleString();
        document.getElementById("legend").classList.add("show");

        var data = {};
        var chartData = {
            columns: [],
            colors: [],
            type : 'donut',
            onclick: function (d, i) { /*console.log("onclick", d, i);*/ },
            onmouseover: function (d, i) { /*console.log("onmouseover", d, i);*/ },
            onmouseout: function (d, i) { /*console.log("onmouseout", d, i);*/ }
        };

        var workerCount = 0;

        // TODO: include in base data filter ?
        mines.forEach(function(mine){
            var mineral = mine.properties.mineral || "Autre";
            var workers = mine.properties.workers || 0;
            if (workers && !isNaN(workers)) workerCount += workers;
            data[mineral] = (data[mineral] || 0) + 1;
        });


        for (var key in data){
            if (data.hasOwnProperty(key)){
                chartData.columns.push([key,data[key]]);
                chartData.colors[key] = Data.getColorForMineral(key);
            }
        }


        chart = c3.generate({
            bindto: '#chart1',
            size:{
                height: 280,
                width: 190
            },
            data: chartData,
            donut: {
                title: current.toLocaleString(),
                label: {
                    format: function (value) { return Math.round(value*100/current) + "%"}
                }
            },
			legend: {
				item: {
					onclick: function (id) {}
				}
			},
            tooltip: {
                format: {
                    title: function (d) { return 'Main&nbsp;Mineral'},
                    value: function (value, ratio, id) {
                        return value.toLocaleString() + "&nbsp;mining&nbsp;sites";
                    }
                    // value: d3.format(',') // apply this format to both y and y2
                }
            }
        });


        var chart_workers = document.getElementById("chart_workers");
        var worker_label = " worker";
        if (workerCount !== 1) worker_label+="s";
        if (chart_workers) chart_workers.innerHTML = workerCount.toLocaleString() + worker_label;


    };

    EventBus.on(EVENT.filterChanged,me.render);

    EventBus.on(EVENT.UIReady,function(){
        me.init();
    });



    return me;

}();