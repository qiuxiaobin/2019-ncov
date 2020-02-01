import React, { useState, Suspense, useEffect } from 'react'
import keyBy from 'lodash.keyby'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

import all from './data/overall'
import provinces from './data/area'
import countries from './data/countries'

import Tag from './Tag'

import './App.css'
import axios from 'axios'

dayjs.extend(relativeTime)

const Map = React.lazy(() => import('./Map'))

const provincesByName = keyBy(provinces, 'name')
const provincesByPinyin = keyBy(provinces, 'pinyin')

const fetcher = (url) => axios(url).then(data => {
  return data.data.data
})

function New ({ title, summary, sourceUrl, pubDate, pubDateStr }) {
  return (
    <div className="new">
      <a className="title" href={sourceUrl}>{ title }</a>
      <div className="new-date">
        <div className="relative">
          {dayjs(pubDate).locale('zh-cn').fromNow()}
        </div>
        {dayjs(pubDate).format('YYYY-MM-DD HH:mm')}
      </div>
      <div className="summary">{ summary.slice(0, 100) }...</div>
    </div>
  )
}

function News ({ province }) {
  const [len, setLen] = useState(8)
  const [news, setNews] = useState([])

  useEffect(() => {
    fetcher(`https://file1.dxycdn.com/2020/0130/492/3393874921745912795-115.json?t=${46341925 + Math.random()}`).then(news => {
      setNews(news)
    })
  }, [])

  return (
    <div className="card">
      <h2>实时动态</h2>
      {
        news
          .filter(n => province ? province.provinceShortName === (n.provinceName && n.provinceName.slice(0, 2)) : true)
          .slice(0, len)
          .map(n => <New {...n} key={n.id} />)
      }
      <div className="more" onClick={() => { setLen() }}>点击查看全部动态>></div>
    </div>
  )
}


function Stat ({ modifyTime, confirmedCount, suspectedCount, deadCount, curedCount, name }) {
  return (
    <div className="card">
      <h2>
        统计 {name ? `· ${name}` : false}
        <span className="due">
          截止时间: {dayjs(modifyTime).format('YYYY-MM-DD HH:mm')}
        </span>
      </h2>
      <div className="row">
        <Tag number={confirmedCount}>
          确诊
        </Tag>
        <Tag number={suspectedCount || '-'}>
          疑似
        </Tag>
        <Tag number={deadCount}>
          死亡
        </Tag>
        <Tag number={curedCount}>
          治愈
        </Tag>
      </div>
    </div>
  )
}


function Area ({ area, onChange }) {
  const renderArea = () => {
    return area.map(x => (
      <div className="province" key={x.name || x.cityName} onClick={() => {
        // 表示在省一级
        if (x.name) {
          onChange(x)
        }
      }}>
        <div className={`area ${x.name ? 'active' : ''}`}>
          { x.name || x.cityName }
        </div>
        <div className="confirmed">{ x.confirmedCount }</div>
        <div className="death">{ x.deadCount }</div>
        <div className="cured">{ x.curedCount }</div>
      </div>
    ))
  }
  return (
    <div>
      <div className="province header">
        <div className="area">地区</div>
        <div className="confirmed">确诊</div>
        <div className="death">死亡</div>
        <div className="cured">治愈</div>
      </div>
      { renderArea() }

    </div>
  )
}

function Header ({ province }) {
  return (
    <header>
      <h1>
        <small>武汉加油，中国加油</small>
        <br />
        <small>肺炎疫情实时动态</small>
      </h1>
      {/* <i>数据来源于丁香园</i> */}
    </header>
  )
}

function App () {
  const [province, _setProvince] = useState(null)
  const setProvinceByUrl = () => {
    const p = window.location.pathname.slice(1)
    _setProvince(p ? provincesByPinyin[p] : null)
  }

  useEffect(() => {
    setProvinceByUrl()
    window.addEventListener('popstate', setProvinceByUrl)
    return () => {
      window.removeEventListener('popstate', setProvinceByUrl)
    }
  }, [])

  useEffect(() => {
    if (province) {
      window.document.title = `肺炎疫情实时地图 | ${province.name}`
    }
  }, [province])

  const setProvince = (p) => {
    _setProvince(p)
    window.history.pushState(null, null, p ? p.pinyin : '/')
  }

  const data = !province ? provinces.map(p => ({
    name: p.provinceShortName,
    value: p.confirmedCount
  })) : provincesByName[province.name].cities.map(city => ({
    name: city.fullCityName,
    value: city.confirmedCount
  }))

  const area = province ? provincesByName[province.name].cities : provinces
  const overall = province ? province : all

  return (
    <div>
      <Header province={province} />
      <Stat { ...overall } name={province && province.name} modifyTime={all.modifyTime} />
      <div className="card">
        <h2>疫情地图 { province ? `· ${province.name}` : false }
        {
          province ? <small
            onClick={() => setProvince(null)}
          >返回全国</small> : null
        }
        </h2>
        <Suspense fallback={<div className="loading">地图正在加载中...</div>}>
          <Map province={province} data={data} onClick={name => {
            const p = provincesByName[name]
            if (p) {
              setProvince(p)
            }
          }} />
          {
            province ? false :
              <div className="tip">
                点击地图中的省份可查看相应数据和动态
              </div>
          }
        </Suspense>
        <Area area={area} onChange={setProvince} />
      </div>
      <News province={province} />
      {/* <Summary /> */}
    </div>
  );
}

export default App;
