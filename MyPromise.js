const STATE = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  PENDING: 'pending'
}

class MyPromise {
  _state = STATE.PENDING
  _value
  _thenCbs = []
  _catchCbs = []

  constructor(cb) {
    try {
      cb(this._onSuccess, this._onFail) 
    } catch (error) {
      this._onFail(error)
    }
  }

  _runCallbacks() {
    if(this._state === STATE.FULFILLED) {
      this._thenCbs.forEach((callback) => {
        callback(this._value)
      })

      this._thenCbs = []
    }

    if(this._state === STATE.REJECTED) {
      this._catchCbs.forEach((callback) => {
        callback(this._value)
      })

      this._catchCbs = []
    }
  }

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

  then(thenCb, catchCb) {
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
        } catch(error) {
          reject(error)
        }
      })

      this._runCallbacks()
    })
  }

  catch(cb) {
    return this.then(undefined, cb)
  }

  finally(cb) {
    return this.then((result) => {
      cb()
      return result
    }, (result) => {
      cb()
      throw result
    })
  }

  static resolve(value) {
    return new MyPromise(resolve => {
      resolve(value)
    })
  }

  static reject(value) {
    return new MyPromise((resolve, reject) => {
      reject(value)
    })
  }

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

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve).catch(reject)
      })
    })
  }

  static any(promises) {
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
  }
}

const a = new MyPromise((res, rej) => {
  setTimeout(() => {
    res(123)
  }, 20)
})

  a.then(res => {
    console.log(123, res)
  })
setTimeout(() => {
  a.then(res => {
    console.log(234, res)
  }).then(res => {
    console.log(333, res)
  })
}, 1000)

