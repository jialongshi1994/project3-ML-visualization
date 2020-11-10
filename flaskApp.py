import csv
import decimal
import json
from datetime import datetime

import sqlite3
from flask import Flask, render_template, url_for, request, jsonify
import scp_data

app = Flask(__name__)


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(o, decimal.Decimal):
            return str(o)
        return json.JSONEncoder.default(self, o)


app.json_encoder = JSONEncoder


def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


def get_cursor(conn):
    conn.row_factory = dict_factory

    return conn.cursor()


# init data
@app.route('/init', methods=['GET'])
def init():
    print('init data')
    scp_data.insertData()
    return 'ok'


# init data
@app.route('/getDataByCountry/<cty>', methods=['GET'])
def getDataByCountry(cty):
    print('init data')
    scp_data.getCountry(cty)
    return 'ok'


# create_table
@app.route('/create_table/<need_import>', methods=['GET'])
def create_table(need_import):
    scp_data.create_table(need_import)
    return 'ok'


@app.route('/country', methods=['GET'])
def country():
    print('get country data')
    conn = scp_data.get_conn()
    cursor = get_cursor(conn)
    cursor.execute("select distinct country  from data order by country ")
    data = cursor.fetchall()
    print(data)
    return jsonify(data)


@app.route('/top10/<time>', methods=['GET'])
def top10_time(time):
    print('get top10  data')
    conn = scp_data.get_conn()
    cursor = get_cursor(conn)
    sql = "select country,sum(active) active,sum(Recovered) Recovered,sum(Deaths) Deaths,sum(Confirmed) Confirmed  from data where stat_date=datetime('" + time + "')  group by country order by sum(Confirmed) desc limit 10"
    print(sql)
    cursor.execute(sql)
    data = cursor.fetchall()
    print(data)
    return jsonify(data)


@app.route('/all/<time>', methods=['GET'])
def alll(time):
    print('get country data')
    conn = scp_data.get_conn()
    cursor = get_cursor(conn)
    cursor.execute("select *  from data where stat_date=datetime('" + time + "')")
    data = cursor.fetchall()
    print(data)
    return jsonify(data)


@app.route('/getTime', methods=['GET'])
def getTime():
    print('get getTime data')
    conn = scp_data.get_conn()
    cursor = get_cursor(conn)
    cursor.execute(
        "select distinct strftime('%Y-%m-%d',stat_date) as stat_date from data order by strftime('%Y-%m-%d',stat_date) asc ")
    data = cursor.fetchall()
    print(data)
    return jsonify(data)


@app.route('/line/<country>', methods=['GET'])
def country_data(country):
    conn = scp_data.get_conn()
    cursor = get_cursor(conn)
    cursor.execute(
        "select strftime('%m-%d',stat_date) as dateTime,sum(active) active,sum(Recovered) Recovered,sum(Deaths) Deaths,sum(Confirmed)  Confirmed from data where country = '" + country + "' group by strftime('%m-%d',stat_date)")
    data = cursor.fetchall()
    print(data)
    return jsonify(data)


@app.route('/', methods=['GET'])
def index():
    return render_template("world.html")


@app.route('/line.html', methods=['GET'])
def line():
    return render_template("line.html")


@app.route('/top10.html', methods=['GET'])
def top10():
    return render_template("top10.html")


@app.route('/world.html', methods=['GET'])
def world():
    return render_template("world.html")


dataMap = {}
dataHeader = []
dataOption = set()


@app.route("/data", methods=["GET"])
def data():
    return jsonify({"data": dataMap, "header": dataHeader})


@app.route("/main.html", methods=["GET"])
def main():
    cty = request.args.get("cty")
    if not cty or cty == '':
        cty = dataMap[0]
    myData = dataMap[cty]
    if myData:
        return render_template("main.html", data=myData, dataOption=dataOption, cty=cty, dataHeader=dataHeader)
    return render_template("main.html", dataOption=dataOption)


if __name__ == '__main__':
    with open('data.csv', 'r') as f:
        reader = csv.reader(f)
        result = list(reader)
        dataHeader = result[0]
        for data in result[1:]:
            if data:
                key = data[0]
                dataOption.add(key)
                val = dataMap.get(key)
                if val:
                    val.append(data)
                else:
                    val = [data]
                    dataMap[data[0]] = val
    app.run(debug=True)
