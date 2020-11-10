$(document).ready(function () {
    var html = "";
    $.get('/country', function (data) {
        if (data) {
            for (var i = 0; i < data.length; i++) {
                html += '<option>' + data[i].country + '</option>'
            }
            $("#select").html(html)
            buildEchart()
        }
    })
    $("#select").change(function () {
        buildEchart();
    })
});

function buildEchart() {
    var selectCountry = $("#select").children('option:selected').val();
    $.get("/line/" + selectCountry, function (data) {
        rebuildChars(data)
    })
}

function rebuildChars(data) {
    let myChart = echarts.init(document.getElementById('main'));
    var rawData = [
        [], [], [], [],[]
    ];
    for (let i = 0; i < data.length; i++) {
        rawData[0][i] = data[i].dateTime;
        rawData[1][i] = data[i].active;
        rawData[2][i] = data[i].Recovered;
        rawData[3][i] = data[i].Deaths;
        rawData[4][i] = data[i].Confirmed;
    }
    console.log(rawData)
    myChart.showLoading();
    myChart.hideLoading();
    let option = {
        title: {
            text: 'trend line charts'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            icon:"circle",
            data: ['active', 'Recovered', 'Deaths', 'Confirmed']
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        toolbox: {
            feature: {
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: rawData[0]
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: 'active',
                type: 'line',
                data: rawData[1]
            },
            {
                name: 'Recovered',
                type: 'line',
                data: rawData[2]
            },
            {
                name: 'Deaths',
                type: 'line',
                data: rawData[3]
            },
            {
                name: 'Confirmed',
                type: 'line',
                data: rawData[4]
            }
        ]
    };
    myChart.setOption(option);
}
