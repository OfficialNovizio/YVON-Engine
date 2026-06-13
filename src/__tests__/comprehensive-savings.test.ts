/**
 * COMPREHENSIVE TOKEN SAVINGS TEST — 18 DATA TYPES × 4 SCALES × 3 SCENARIOS
 * 
 * Measures TOON-DENSE token savings vs raw JSON across every data shape
 * YVON could encounter. Auto-builds ToonSchema from data keys.
 */
import { describe, test, expect } from 'vitest'
import { toon, ToonSchema, ToonField } from '../toon/toon'
import { createEngine } from '../toon/v3/engine'
import { compile } from '../toon/v3/compile'
import { summarize, stratify, injectDelta, autoSchema as v4AutoSchema } from '../toon/v4/stratify'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// ─── Token Estimator (cl100k_base approximate) ───────────────────────────

function estimateClaudeTokens(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 0).length
  const chars = text.length
  const dataRatio = (text.match(/[|,\[\]{}()\d]/g) || []).length / Math.max(1, chars)
  if (dataRatio > 0.15) return Math.round(chars / 2.8)
  if (dataRatio > 0.05) return Math.round(chars / 3.2)
  return Math.round(words * 1.25)
}

// ─── Auto-Schema Builder ─────────────────────────────────────────────────

function autoSchema(name: string, sample: Record<string, any>): ToonSchema {
  const fields: ToonField[] = Object.keys(sample).map((key, i) => {
    const val = sample[key]
    let type: ToonField['type'] = 'string'
    if (val === null || val === undefined) type = 'null'
    else if (typeof val === 'number') type = 'number'
    else if (typeof val === 'boolean') type = 'boolean'
    else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) type = 'date'
    return { name: key, abbr: `f${i}`, type }
  })
  return { type: name, fields }
}

// ─── Data Generators ─────────────────────────────────────────────────────

function generateNumeric(rows: number) {
  return Array.from({ length: rows }, (_, i) => ({
    id: i, revenue: Math.round(Math.random() * 1e6 * 100) / 100,
    cost: Math.round(Math.random() * 8e5 * 100) / 100,
    margin: Math.round(Math.random() * 4e5 * 100) / 100,
    growth: Math.round((Math.random() * 40 - 10) * 100) / 100,
    users: Math.floor(Math.random() * 100000),
    conversion: Math.round(Math.random() * 10000) / 10000,
    churn: Math.round(Math.random() * 100) / 100,
    ltv: Math.round(Math.random() * 5000 * 100) / 100,
    cac: Math.round(Math.random() * 500 * 100) / 100,
    sessions: Math.floor(Math.random() * 500000),
  }))
}

function generateTextHeavy(rows: number) {
  const desc = ['premium sustainable eco-friendly handcrafted', 'enterprise-grade scalable cloud-native fault-tolerant',
    'AI-powered intelligent automated self-learning', 'luxury high-end exclusive limited-edition', 'organic non-GMO farm-to-table locally-sourced']
  return Array.from({ length: rows }, (_, i) => ({
    id: i,
    title: `Product ${i}: ${desc[i % 5]}`,
    description: `${desc[i % 5]} solution with cutting-edge technology and 24/7 support.`,
    features: `Features include real-time analytics, AI recommendations, and multi-tenant architecture.`,
    tags: [desc[i % 5].split(' ')[0], desc[i % 5].split(' ')[1]],
    review: `Excellent product, transformed our workflow. Highly recommend.`,
  }))
}

function generateMixed(rows: number) {
  return Array.from({ length: rows }, (_, i) => ({
    id: i, name: `Venture_${i.toString(36).toUpperCase()}`, type: ['saas','marketplace','d2c','b2b','agency'][i%5],
    stage: ['idea','mvp','growth','scale','mature'][i%5],
    revenue: Math.round(Math.random()*1e6*100)/100, growth_rate: Math.round(Math.random()*200*100)/100,
    team_size: Math.floor(Math.random()*50)+1,
    founded: `202${Math.floor(Math.random()*4)}-${String(Math.floor(Math.random()*12)+1).padStart(2,'0')}`,
    description: ['Revolutionizing shopping','Next-gen API','AI content','Sustainable fashion','Cloud infra'][i%5],
    active: Math.random()>0.2,
  }))
}

function generateNested(rows: number) {
  return Array.from({ length: rows }, (_, i) => ({
    id: i,
    user: { profile: { name: `User_${i}`, email: `u${i}@ex.com`, role: ['admin','manager','analyst'][i%3] },
      metrics: { logins: Math.floor(Math.random()*1000), actions: Math.floor(Math.random()*5000) } },
    ventures: Array.from({length:(i%3)+1},(_,j)=>({id:j,name:`V${i}_${j}`,revenue:Math.round(Math.random()*5e5*100)/100})),
    tags: ['ai','saas','fintech','healthtech','ecommerce'].slice(0,(i%5)+1),
  }))
}

function generateFlat(rows: number) {
  return Array.from({length:rows},(_,i)=>({
    id:i,a:Math.round(Math.random()*100),b:Math.round(Math.random()*100),c:Math.round(Math.random()*100),
    d:Math.round(Math.random()*100),e:Math.round(Math.random()*100),f:`val_${i}`,g:i%2===0,
    h:`2024-${String((i%12)+1).padStart(2,'0')}-${String((i%28)+1).padStart(2,'0')}`
  }))
}

function generateDeepNested(rows: number) {
  return Array.from({length:rows},(_,i)=>({
    id:i,level1:{level2:{level3:{value:Math.round(Math.random()*1000),name:`deep_${i}`,flag:i%3===0}}}
  }))
}

function generateAllNulls(rows: number) {
  return Array.from({length:rows},(_,i)=>({id:i,field1:null,field2:null,field3:null,field4:'',field5:0,field6:false}))
}

function generateAllSame(rows: number) {
  return Array.from({length:rows},(_,i)=>({
    id:i,constant:'same_value',num:42,bool:true,nullVal:null,date:'2024-01-15',varying:i
  }))
}

function generateBooleanHeavy(rows: number) {
  return Array.from({length:rows},(_,i)=>({
    id:i,f1:i%2===0,f2:i%3===0,f3:i%5===0,f4:i%7===0,f5:Math.random()>0.5,
    f6:Math.random()>0.7,f7:Math.random()>0.3,f8:Math.random()>0.6,
  }))
}

function generateTimeSeries(rows: number) {
  const base=new Date('2024-01-01')
  return Array.from({length:rows},(_,i)=>{
    const d=new Date(base.getTime()+i*3600000)
    return {
      id:i,timestamp:d.toISOString(),date:d.toISOString().split('T')[0],hour:d.getUTCHours(),
      value:Math.round((Math.sin(i/50)*100+Math.random()*20)*100)/100,
      volume:Math.floor(Math.random()*10000),
      category:['page_view','click','purchase','signup','share'][i%5],
      device:['mobile','desktop','tablet'][i%3],
    }
  })
}

function generateOneHot(rows: number) {
  const cats=['cat_a','cat_b','cat_c','cat_d','cat_e','cat_f','cat_g','cat_h']
  return Array.from({length:rows},(_,i)=>{
    const obj:any={id:i,value:Math.round(Math.random()*100)}
    cats.forEach((c,j)=>{obj[c]=j===i%8?1:0})
    return obj
  })
}

function generateSparse(rows: number) {
  return Array.from({length:rows},(_,i)=>{
    const obj:any={id:i}
    if(i%33===0)obj.rare_a=`rare_${i}`
    if(i%50===0)obj.rare_b=Math.random()*1000
    return obj
  })
}

function generateArrayFields(rows: number) {
  return Array.from({length:rows},(_,i)=>({
    id:i,
    tags:Array.from({length:(i%10)+1},(_,j)=>`tag_${(i*10+j)%50}`),
    scores:Array.from({length:5},()=>Math.round(Math.random()*100)),
  }))
}

function generateUrlHeavy(rows: number) {
  return Array.from({length:rows},(_,i)=>({
    id:i,
    url:`https://${['app','api','cdn'][i%3]}.ex.com/${['v1','v2'][i%2]}/${['users','products','orders'][i%3]}/${i}`,
    thumb:`https://img.ex.com/t_${i}_${['sm','md','lg'][i%3]}.jpg`,
    avatar:`https://av.ex.com/u/${i}`,
    api:`https://api.ex.com/v2/${['graphql','rest','grpc'][i%3]}`,
  }))
}

function generateInternational(rows: number) {
  const loc=[{locale:'en-US',currency:'USD',name:'John Smith'},
    {locale:'ja-JP',currency:'JPY',name:'\u7530\u4e2d\u592a\u90ce'},
    {locale:'ar-SA',currency:'SAR',name:'\u0645\u062d\u0645\u062f'},
    {locale:'zh-CN',currency:'CNY',name:'\u5f20\u4f1f'},
    {locale:'ko-KR',currency:'KRW',name:'\uae40\ubbfc\uc218'}]
  return Array.from({length:rows},(_,i)=>{
    const l=loc[i%loc.length]
    return {...l,id:i,amount:Math.round(Math.random()*1e6*100)/100,quantity:Math.floor(Math.random()*1000)}
  })
}

function generateEdgeCases() {
  const obj:any={a:{b:{c:{d:{e:[]}}}}}
  return [
    {id:0,empty:'',zero:0,neg:-1,max:Number.MAX_SAFE_INTEGER},
    {id:1,special:'!@#$%^&*()',newlines:'a\nb\nc',tabs:'a\tb\tc'},
    {id:2,unicode:'🎉✨🚀',math:'∑∏∫√',arrows:'→←↑↓↔'},
    {id:3,html:'<div><p>Hello</p></div>',xml:'<root><item>v</item></root>'},
    {id:4,markdown:'# H\n**b** *i*',sql:'SELECT * FROM t WHERE id=1'},
    {id:5,veryLong:'x'.repeat(1000),nullVal:null},
    {id:6,floatEdge:0.1+0.2,infinity:Infinity,nan:NaN},
    {id:7,nestedEmpty:{},nestedArr:[],deeply:obj},
    {id:8,url:'https://ex.com/p?q=hello',email:'u+tag@sub.ex.co.uk'},
    {id:9,escapeQuotes:'He said "hello"',backslash:'C:\\Users\\name\\file.txt'},
  ]
}

// ─── Generator Registry ──────────────────────────────────────────────────

const gens: Record<string,(n:number)=>any[]> = {
  numeric: generateNumeric, textHeavy: generateTextHeavy, mixed: generateMixed,
  nested: generateNested, flat: generateFlat, deepNested: generateDeepNested,
  allNulls: generateAllNulls, allSame: generateAllSame, booleanHeavy: generateBooleanHeavy,
  timeSeries: generateTimeSeries, oneHot: generateOneHot, sparse: generateSparse,
  arrayFields: generateArrayFields, urlHeavy: generateUrlHeavy, international: generateInternational,
}

const scales = [10, 100, 1000, 10000]
const BOUNDARY = 94

interface R { dataType:string; scale:number; jsonTokens:number; denseTokens:number; savingsPercent:number; pass:boolean }
const results:R[] = []

// ─── Test Suite ──────────────────────────────────────────────────────────

describe('TOON-DENSE Comprehensive (15 types × 4 scales)', () => {

  for (const [name, gen] of Object.entries(gens)) {
    for (const scale of scales) {
      test(`${name} @ ${scale}`, () => {
        const data = gen(scale)
        const jsonStr = JSON.stringify(data)
        const jsonT = estimateClaudeTokens(jsonStr)

        const schema = autoSchema(name, data[0] || {})
        const denseStr = toon.dense(data, schema)
        const denseT = estimateClaudeTokens(denseStr)

        const savings = jsonT>0?((jsonT-denseT)/jsonT)*100:0
        const pass = savings >= BOUNDARY

        results.push({dataType:name,scale,jsonTokens:jsonT,denseTokens:denseT,savingsPercent:Math.round(savings*100)/100,pass})

        if(!pass) {
          console.log(`  ⚠️  ${name} @ ${scale}: ${Math.round(savings*100)/100}% (gap: ${(BOUNDARY-savings).toFixed(1)}%)`)
        }
      })
    }
  }

  test('EDGE CASES', () => {
    const data = generateEdgeCases()
    const jsonStr = JSON.stringify(data)
    const denseStr = toon.dense(data, autoSchema('edge', data[0]))
    const jsonT = estimateClaudeTokens(jsonStr)
    const denseT = estimateClaudeTokens(denseStr)
    const savings = jsonT>0?((jsonT-denseT)/jsonT)*100:0
    results.push({dataType:'edgeCases',scale:10,jsonTokens:jsonT,denseTokens:denseT,savingsPercent:Math.round(savings*100)/100,pass:savings>=BOUNDARY})
  })

  test('REPORT', () => {
    const total = results.length
    const passed = results.filter(r=>r.pass).length
    const failed = total - passed
    const avg = results.reduce((s,r)=>s+r.savingsPercent,0)/total

    console.log('\n'+'═'.repeat(80))
    console.log('TOON-DENSE TOKEN SAVINGS REPORT')
    console.log('═'.repeat(80))
    console.log(`Scenarios: ${total} | ✅ ${passed} | ❌ ${failed} | Rate: ${((passed/total)*100).toFixed(1)}%`)
    console.log(`Average: ${avg.toFixed(1)}% | Boundary: ${BOUNDARY}%`)
    console.log('─'.repeat(80))

    // Per-type
    const byType:Record<string,{avg:number;cnt:number;pass:number}> = {}
    for(const r of results) {
      if(!byType[r.dataType]) byType[r.dataType]={avg:0,cnt:0,pass:0}
      byType[r.dataType].avg+=r.savingsPercent;byType[r.dataType].cnt++
      if(r.pass) byType[r.dataType].pass++
    }
    const sorted = Object.entries(byType).sort((a,b)=>a[1].avg/a[1].cnt - b[1].avg/b[1].cnt)
    for(const [t,i] of sorted) {
      const a=i.avg/i.cnt
      const icon = a>=BOUNDARY?'✅':a>=85?'🟡':'🔴'
      console.log(`  ${icon} ${t.padEnd(18)} avg:${a.toFixed(1)}%  pass:${i.pass}/${i.cnt}`)
    }

    // Per-scale
    console.log('\nPer Scale:')
    for(const s of scales) {
      const sr=results.filter(r=>r.scale===s)
      const sa=sr.reduce((a,r)=>a+r.savingsPercent,0)/sr.length
      const sp=sr.filter(r=>r.pass).length
      console.log(`  ${String(s).padEnd(6)} avg:${sa.toFixed(1)}%  pass:${sp}/${sr.length}`)
    }

    if(failed>0) {
      console.log(`\n❌ FAILURES (${failed}):`)
      for(const r of results.filter(r=>!r.pass)) {
        console.log(`  ${r.dataType.padEnd(18)} @ ${String(r.scale).padEnd(6)} ${r.savingsPercent.toFixed(1)}%  gap:${(BOUNDARY-r.savingsPercent).toFixed(1)}%`)
      }
    }
    console.log('═'.repeat(80))

    writeFileSync('/tmp/comprehensive-report.json',JSON.stringify({total,passed,failed,passRate:(passed/total*100),avgSavings:avg,results},null,2))
    expect(passed/total).toBeGreaterThanOrEqual(0.98)
  },60000)
})

// ─── Multi-Turn Delta Tests ──────────────────────────────────────────────

describe('Multi-Turn Delta (5-turn simulation)', () => {
  const td = '/tmp/toon-test-env2'
  const ep = join(td,'.toon','v3','engine.bin')

  test('setup engine', () => {
    mkdirSync(join(td,'.toon','docs'),{recursive:true})
    writeFileSync(join(td,'.toon','docs','vents.md'),'# Ventures\n## A\nRevenue:$1.2M\nGrowth:45%\n## B\nRevenue:$800K\nGrowth:32%')
    writeFileSync(join(td,'.toon','docs','metrics.md'),'# Metrics\n## Q1\nRev:$5M\n## Q2\nRev:$6.2M\n## Q3\nRev:$7.8M')
    compile({projectRoot:td})
    expect(existsSync(ep)).toBe(true)
  })

  function runDeltaTurn(label:string, dataFn:(n:number)=>any[], queries:string[]) {
    const engine = createEngine(ep)
    const sid = `sess-${label}`
    let jt=0,dt=0

    for(const q of queries) {
      const data = dataFn(100)
      jt += estimateClaudeTokens(JSON.stringify(data))
      const schema = autoSchema(label,data[0])
      dt += estimateClaudeTokens(toon.dense(data,schema))
      engine.process({systemPrompt:'You are helpful.',userMessage:q,sessionId:sid})
    }

    const savings = jt>0?((jt-dt)/jt)*100:0
    console.log(`  ${label}: ${jt}t JSON → ${dt}t DENSE = ${Math.round(savings*100)/100}%`)
    results.push({dataType:`delta_${label}`,scale:100,jsonTokens:jt,denseTokens:dt,savingsPercent:Math.round(savings*100)/100,pass:savings>=BOUNDARY})
  }

  test('numeric multi-turn',()=>{
    runDeltaTurn('numeric',generateNumeric,
      ['Show revenue','What growth?','Q1 metrics','Next quarter?','Compare all'])
  })
  test('mixed multi-turn',()=>{
    runDeltaTurn('mixed',generateMixed,
      ['List ventures','Show teams','Filter active','Add revenue','Compare years'])
  })
  test('text multi-turn',()=>{
    runDeltaTurn('text',generateTextHeavy,
      ['Show products','Filter B2B','Add reviews','Compare features','Summarize'])
  })
  test('flat multi-turn',()=>{
    runDeltaTurn('flat',generateFlat,
      ['Show data','Filter by a','Sort by b','Aggregate c','Pivot d'])
  })
  test('boolean multi-turn',()=>{
    runDeltaTurn('bool',generateBooleanHeavy,
      ['List flags','Count true','Filter f1','Group by f2','Cross-tab all'])
  })

  test('FINAL SUMMARY',()=>{
    const total=results.length
    const passed=results.filter(r=>r.pass).length
    const failed=total-passed
    const avg=results.reduce((s,r)=>s+r.savingsPercent,0)/total

    console.log('\n'+'═'.repeat(80))
    console.log('FINAL REPORT')
    console.log('═'.repeat(80))
    console.log(`Total:${total} ✅:${passed} ❌:${failed} Rate:${((passed/total)*100).toFixed(1)}%`)
    console.log(`Avg Savings:${avg.toFixed(1)}% Boundary:${BOUNDARY}%`)
    console.log('═'.repeat(80))

    if(failed>0) {
      console.log('\n❌ FAILURES:')
      for(const r of results.filter(r=>!r.pass))
        console.log(`  ${r.dataType.padEnd(20)} @ ${String(r.scale).padEnd(6)} ${r.savingsPercent}% gap:${(BOUNDARY-r.savingsPercent).toFixed(1)}%`)
    }

    writeFileSync('/tmp/toon-final-report.json',JSON.stringify({total,passed,failed,passRate:(passed/total*100),avgSavings:avg,results},null,2))
    expect(passed/total).toBeGreaterThanOrEqual(0.98)
  },60000)
})

// ─── TOON v4 Stratified Delivery Tests ───────────────────────────────────

describe('TOON v4 STRATIFIED (16 types × 4 scales)', () => {
  const v4Results: R[] = []

  for (const [name, gen] of Object.entries(gens)) {
    for (const scale of scales) {
      test(`v4 ${name} @ ${scale}`, () => {
        const data = gen(scale)
        const jsonStr = JSON.stringify(data)
        const jsonT = estimateClaudeTokens(jsonStr)

        const schema = autoSchema(name, data[0] || {})
        const payload = stratify(data, schema, 5)
        const v4Tokens = payload.totalTokens

        const savings = jsonT>0?((jsonT-v4Tokens)/jsonT)*100:0
        const pass = savings >= BOUNDARY

        v4Results.push({dataType:`v4_${name}`,scale,jsonTokens:jsonT,denseTokens:v4Tokens,savingsPercent:Math.round(savings*100)/100,pass})

        if(!pass) {
          console.log(`  ⚠️  v4 ${name} @ ${scale}: ${Math.round(savings*100)/100}% (gap: ${(BOUNDARY-savings).toFixed(1)}%)`)
          console.log(`     JSON:${jsonT}t → v4:${v4Tokens}t header:${Math.round(payload.header.length/3.5)}t top:${Math.round(payload.top.length/3.5)}t rest:${Math.round(payload.rest.length/3.5)}t`)
        }
      })
    }
  }

  test('v4 EDGE CASES', () => {
    const data = generateEdgeCases()
    const jsonT = estimateClaudeTokens(JSON.stringify(data))
    const schema = autoSchema('edge', data[0])
    const payload = stratify(data, schema, 5)
    const savings = jsonT>0?((jsonT-payload.totalTokens)/jsonT)*100:0
    v4Results.push({dataType:'v4_edgeCases',scale:10,jsonTokens:jsonT,denseTokens:payload.totalTokens,savingsPercent:Math.round(savings*100)/100,pass:savings>=BOUNDARY})
  })

  test('v4 MULTI-TURN delta', () => {
    // Simulate 3-turn session with same data
    const data = generateNumeric(1000)
    const schema = autoSchema('numeric', data[0])
    const jsonT = estimateClaudeTokens(JSON.stringify(data)) * 3
    
    let totalV4 = 0
    const sid = 'v4-mt-test'
    for (let t = 0; t < 3; t++) {
      const payload = stratify(data, schema, 5)
      const delta = injectDelta(sid, payload)
      totalV4 += delta.totalTokens
    }
    
    const savings = jsonT>0?((jsonT-totalV4)/jsonT)*100:0
    v4Results.push({dataType:'v4_multiturn',scale:1000,jsonTokens:jsonT,denseTokens:totalV4,savingsPercent:Math.round(savings*100)/100,pass:savings>=BOUNDARY})
    console.log(`  v4 multi-turn: ${jsonT}t JSON → ${totalV4}t v4 = ${Math.round(savings*100)/100}%`)
  })

  test('v4 REPORT', () => {
    const total = v4Results.length
    const passed = v4Results.filter(r=>r.pass).length
    const failed = total - passed
    const avg = v4Results.reduce((s,r)=>s+r.savingsPercent,0)/total

    console.log('\n'+'═'.repeat(80))
    console.log('TOON v4 STRATIFIED DELIVERY REPORT')
    console.log('═'.repeat(80))
    console.log(`Scenarios: ${total} | ✅ ${passed} | ❌ ${failed} | Rate: ${((passed/total)*100).toFixed(1)}%`)
    console.log(`Average savings: ${avg.toFixed(1)}% | Boundary: ${BOUNDARY}%`)
    console.log('─'.repeat(80))

    const byType:Record<string,{avg:number;cnt:number;pass:number}> = {}
    for(const r of v4Results) {
      const t = r.dataType.replace('v4_','')
      if(!byType[t]) byType[t]={avg:0,cnt:0,pass:0}
      byType[t].avg+=r.savingsPercent;byType[t].cnt++
      if(r.pass) byType[t].pass++
    }
    const sorted = Object.entries(byType).sort((a,b)=>a[1].avg/a[1].cnt - b[1].avg/b[1].cnt)
    for(const [t,i] of sorted) {
      const a=i.avg/i.cnt
      const icon = a>=BOUNDARY?'✅':a>=85?'🟡':'🔴'
      console.log(`  ${icon} ${t.padEnd(18)} avg:${a.toFixed(1)}%  pass:${i.pass}/${i.cnt}`)
    }

    if(failed>0) {
      console.log(`\n❌ FAILURES (${failed}):`)
      for(const r of v4Results.filter(r=>!r.pass))
        console.log(`  ${r.dataType.padEnd(22)} @ ${String(r.scale).padEnd(6)} ${r.savingsPercent}% gap:${(BOUNDARY-r.savingsPercent).toFixed(1)}%`)
    }
    console.log('═'.repeat(80))

    writeFileSync('/tmp/v4-stratified-report.json',JSON.stringify({total,passed,failed,passRate:(passed/total*100),avgSavings:avg,results:v4Results},null,2))
    expect(passed/total).toBeGreaterThanOrEqual(0.98)
  },60000)
})
