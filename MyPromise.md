# Implement My Own Promise 

## What is the Promise?

- Promise [Promise A+](https://promisesaplus.com/#point-8) 
- Thenable
- Value
- Exception and reason

## Constructor

- Parameters

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

## onSuccess and onFail

- State
- Value

```js
const STATE = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  PENDING: 'pending'
}
// ...Code
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

## then

- Callbacks

```js
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
    // const p = new MyPromise((resolve) => {
    //   setTimeout(() => {
    //     resolve('End')
    //   }, 20)
    // })
    // p.then(...Code)
    // setTimeout(() => {
    //   p.then(...Code)
    // }, 40)
  }

  if(this._state === STATE.REJECTED) {
    this._catchCbs.forEach((callback) => {
      callback(this._value)
    })

    this._catchCbs = []
  }
}

then(thenCb, catchCb) {
  this._thenCbs.push(thenCb)
  this._catchCbs.push(catchCb)
  this._runCallbacks()
}

// Code: https://github.com/mf950511/promiseMD/blob/main/MyPromiseMD_1.js
```

- With chaining
- Catch errors

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
```

- Value(reason) is a Promise.

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

  //Code: https://github.com/mf950511/promiseMD/blob/main/MyPromiseMD_2.js
```

- Asynchronous
- Event loop and message queue
- SetState

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

## catch

```js
  catch(cb) {
    return this.then(undefined, cb)
  }
```

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

## static resolve

```js
  static resolve(value) {
    return new MyPromise(resolve => {
      resolve(value)
    })
  }
```

## static reject

```js
  static reject(value) {
    return new MyPromise((resolve, reject) => {
      reject(value)
    })
  }
```

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

## generator, iterator, async, await

- Iterator
- Generator

```js
const obj = {a: 1, b: 2, c:3}
const arr = [1,2,3]
for(let val of obj) {
  console.log(val)
}

for(let val of arr) {
  console.log(val)
}

function* testGenerator() {
  yield 1
  yield 2
  return 3
}
const generator = testGenerator()
generator.next()
generator.next()
generator.next()
```

- asynchronous

```js
function fetchData() {
  setTimeout(() => {
    it.next(300) // it.throw(300)
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

- Async and await

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
        value.then(res => {
          step(res)
        })
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