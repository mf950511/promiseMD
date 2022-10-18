---
marp: true
---

# Implement My Own Promise 

---

## What is the Promise?

- Promise [Promise A+](https://promisesaplus.com/#point-8) 
- Thenable
- State

```js
const STATE = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  PENDING: 'pending'
}
```

- Value
- Exception and reason

---

## Constructor

```js
class MyPromise {
  constructor(cb) {
    try {
      cb(this._onSuccess, this._onFail) 
    } catch (error) {
      this._onFail(error)
    }
  }
}
```
---

## onSuccess and onFail

```js
// ...Code
_state = STATE.PENDING
_value
_onSuccess = (value) => {
  if(this._state !== STATE.PENDING) {
    return 
  }

  this._value = value
  this._state = STATE.FULFILLED
}

_onFail = (value) => {
  if(this._state !== STATE.PENDING) {
    return 
  }

  this._value = value
  this._state = STATE.REJECTED
}

```
---
## Then function

---

```js
// ...Code
_thenCbs = []
_catchCbs = []
then(thenCb, catchCb) {
  this._thenCbs.push(thenCb)
  this._catchCbs.push(catchCb)
  this._runCallbacks()
}

_onSuccess = (value) => {
  // ...Code
  this._runCallbacks()
}

_onFail = (value) => {
  // ...Code
  this._runCallbacks()
}

_runCallbacks() {
  if(this._state === STATE.FULFILLED) {
    this._thenCbs.forEach((callback) => {
      callback(this._value)
    })

    this._thenCbs = []
    // const p = new MyPromise((res) => {
    //   setTimeout(() => {
    //     res('success')
    //   }, 20)
    // })

    // p.then(res => {
    //   console.log(1, res)
    // })

    // setTimeout(() => {
    //   p.then(res => {
    //     console.log(2, res)
    //   })
    // }, 40)
  }

  if(this._state === STATE.REJECTED) {
    this._catchCbs.forEach((callback) => {
      callback(this._value)
    })

    this._catchCbs = []
  }
}
```

---

- The errors can be caught by which 'catch' block?
- Can we resolve an error?

--- 

- With chaining
- Catch errors

---
```js
then(thenCb, catchCb) {
  // this._thenCbs.push(thenCb)
  // this._catchCbs.push(catchCb)
  // this._runCallbacks()
  return new MyPromise((resolve, reject) => {
    this._thenCbs.push((result) => {
      if(thenCb == null) {
        resolve(result)
        return
      }

      try {
        resolve(thenCb(result))
      } catch (error) {
        reject(error)
      }
    })

    this._catchCbs.push((result) => {
      if(catchCb == null) {
        reject(result)
        return 
      }

      try {
        resolve(catchCb(result))
      } catch (error) {
        reject(error)
      }
    })
    this._runCallbacks()
  })
}

// 
```

---

- Value(reason) is a Promise.

---

```js
  _onSuccess = (value) => {
    if(this._state !== STATE.PENDING) {
      return 
    }

    if(value instanceof MyPromise) {
      value.then(this._onSuccess, this._onFail)
      return
    }

    this._value = value
    this._state = STATE.FULFILLED
    this._runCallbacks()
  }

  _onFail = (value) => {
    if(this._state !== STATE.PENDING) {
      return 
    }

    if(value instanceof MyPromise) {
      value.then(this._onSuccess, this._onFail)
      return
    }

    this._value = value
    this._state = STATE.REJECTED
    this._runCallbacks()
  }
  // const p = new MyPromise((res) => {
  //   res(new MyPromise((res1) => {
  //     setTimeout(() => {
  //       res1('success')
  //     }, 1000)
  //   }))
  // })
  // p.then(res => {
  //   console.log(1, res)
  // })
```
---

- Asynchronous
- Microtask and macrotask
- Event loop and message queue

--- 

```js
  _onSuccess = (value) => {
    queueMicrotask(() => {
      if(this._state !== STATE.PENDING) {
        return 
      }

      if(value instanceof MyPromise) {
        value.then(this._onSuccess, this._onFail)
        return
      }

      this._value = value
      this._state = STATE.FULFILLED
      this._runCallbacks()
    })
  }

  _onFail = (value) => {
    queueMicrotask(() => {
      if(this._state !== STATE.PENDING) {
        return 
      }

      if(value instanceof MyPromise) {
        value.then(this._onSuccess, this._onFail)
        return
      }

      this._value = value
      this._state = STATE.REJECTED
      this._runCallbacks()
    })
  }
  //Code: https://github.com/mf950511/promiseMD/blob/main/MyPromiseMD_3.js
```

---

## catch

```js
  catch(cb) {
    return this.then(undefined, cb)
  }
```

---

## finally

```js
  finally(cb) {
    return this.then((result) => {
      cb()
      return result
    }, (result) => {
      cb()
      throw result
    })
  }
```

---

## static resolve

```js
  static resolve(value) {
    return new MyPromise(resolve => {
      resolve(value)
    })
  }
```

---

## static reject

```js
  static reject(value) {
    return new MyPromise((resolve, reject) => {
      reject(value)
    })
  }
```
---
## static all

```js
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      let completedCount = 0
      let results = []
      for(let i = 0; i < promises.length; i++) {
        const promise = promises[i]
        promise.then(value => {
          completedCount++
          results[i] = value
          if(completedCount === promises.length) {
            resolve(results)
          }
        }).catch(reject)
      }
    })
  }
```
---
## static allSettled

```js
  static allSettled(promises) {
    return new MyPromise((resolve) => {
      let completedCount = 0
      let results = []
      for(let i = 0; i < promises.length; i++) {
        const promise = promises[i]
        promise.then(value => {
          results[i] = {status: STATE.FULFILLED, value}
        })
        .catch(reason => {
          results[i] = {status: STATE.REJECTED, reason}
        })
        .finally(() => {
          completedCount++
          if(completedCount === promises.length) {
            resolve(results)
          }
        })
      }
    })
  }
```
---
## static race

```js
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve).catch(reject)
      })
    })
  }
```
---
## static any

```js
  return new MyPromise((resolve, reject) => {
    let errors = []
    let rejectedCount = 0
    for(let i = 0; i < promises.length; i++) {
      const promise = promises[i]
      promise.then(resolve).catch(error => {
        rejectedCount++
        errors[i] = error
        if(rejectedCount === promises.length) {
          reject(new AggregateError(errors, 'All promises were rejected!'))
        }
      })
    }
  })
  // https://github.com/mf950511/promiseMD/blob/main/MyPromise.js
```
---
## Generator, iterator
---
```js
const obj = {a: 1, b: 2, c:3}
const arr = [1,2,3]
for(let val of obj) {
  console.log(val)
}

for(let val of arr) {
  console.log(val)
}
console.log(obj[Symbol.iterator]) // obj is not iterable
console.log(arr[Symbol.iterator]) // ƒ values() { [native code] }
const it = arr[Symbol.iterator]()
it.next()
```
---
```js
function* testGenerator1() {
  yield 1
  yield 2
  yield 3
}
const generator1 = testGenerator1()
for(let val of generator1) {
  console.log(val)
}
console.log(generator1[Symbol.iterator])
```
---
```js
function* testGenerator(x) {
  var a = yield x + 6
  console.log(a)
  var b = yield a + 7
  console.log(b)
  return a + b + 8
}
const generator = testGenerator(1)
generator.next()
generator.next(3)
generator.next(11)

```
---
- asynchronous
---

```js
function fetchData() {
  setTimeout(() => {
    it.next(300) // it.throw(300)
    // throw new Error('new test')
  }, 1000)
}

function *main() {
  try {
    var data = yield fetchData()
    console.log('data', data)
    var data1 = yield fetchData()
    console.log('data1', data1)
  } catch (err) {
    console.log('err', err)
  }
}

var it = main()
it.next()
```

---
## Generator and promise
---
```js
function fetchData() {
  return new Promise((res) => {
    setTimeout(() => {
      res(123)
    }, 1000)
  })
}

function asyncMockWrapper(iterator) {
  return new Promise((resolve, reject) => {
    function step(nextVal) {
      let result
      try {
        result = iterator.next(nextVal)
      } catch (error) {
        return reject(error)
      }
      const { value, done } = result
      if(done) {
        return resolve(value)
      } else {
        value.then(step)
      }
    }
    step()
  })
}

function *main() {
  try {
    var data = yield fetchData()
    console.log('data', data)
    var data1 = yield fetchData()
    console.log('data1', data1)
  } catch (err) {
    console.log('err', err)
  }
}

asyncMockWrapper(main())
```
---
## Async and await
---
```js
function fetchData() {
  return new Promise((res) => {
    setTimeout(() => {
      res(300)
    }, 1000)
  })
}

async function main() {
  try {
    var data = await fetchData()
    console.log('data', data)
    var data1 = await fetchData()
    console.log('data1', data1)
  } catch (err) {
    console.log('err', err)
  }
}

main()
```
---
## Summary

- Promise and errors handling
- Microtask and macrotask
- Generator and promise
---
## Q & A