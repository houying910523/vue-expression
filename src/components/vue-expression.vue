<template>
  <section>
    <label style="width: 55px">表达式: </label>
    <div style="display: inline-block">
      <div contenteditable="true"
           ref="expression"
           style="display: inline-block; width: 520px; height: 25px; line-height: 25px; border-radius: 5px; border: 1px solid #ccc; padding: 2px 10px;"
           @keyup="onKeyUp"
           @keydown="onKeyDown"
           @blur="parseExpression">
      </div>
      <div v-if="errorMsg" style="width: 300px; text-align: center">
        <span style="color: red; font-size: 13px">{{errorMsg}}</span>
      </div>
    </div>
    <div class="selection" v-show="showSelection" ref="selection">
      <ul class="el-scrollbar__wrap el-select-dropdown__list">
        <li v-for="(field, idx) in filteredFields" :key="idx" @click="onOptionClick(field)" class="el-select-dropdown__item">
          <span style="float: left">{{field.name}}</span>
          <!--          <span style="float: left; color: #8492a6; font-size: 13px; margin-right: 10px"> ({{field.type}})</span>-->
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
export default {
  name: 'vue-expression',
  props: {
    fields: {
      required: false,
      type: Array,
      default () {
        return []
      }
    },
    ruleConfig: {
      required: true,
      type: Object
    }
  },
  data () {
    return {
      regexp: {
        number: '\\d+(\\.\\d+)?',
        operator: '[\\+\\-\\*\\/]',
        html: '\\<[a-z]+(\\s+[a-z]+=".+?")+\\>([a-zA-Z0-9_]+)\\<\\/[a-z]+\\>',
        search: '[a-zA-Z][a-zA-Z0-9_]*',
        logic: '(&gt;)|(&lt;)|(!=)|(=)|(&gt;=)|(&lt;=)',
        bracket: '[()]'
      },
      validKeys: /[a-zA-Z0-9_\\-\\+\\*\\/\\>\\<=!\\.()]/,
      showSelection: false,
      keyword: '',
      vars: {

      },
      errorMsg: ''
    }
  },
  watch: {
    showSelection (v) {
      if (!v) {
        let selection = this.$refs.selection
        selection.parentNode.removeChild(selection)
      }
    }
  },
  computed: {
    filteredFields () {
      if (this.keyword) {
        return this.fields.filter(field => field.name.includes(this.keyword))
      } else {
        return this.fields
      }
    }
  },
  methods: {
    onKeyUp (e) {
      let html = this.$refs.expression.innerHTML
      // console.log(html)
      let tokens = this.splitToken(html)
      let cache = {}
      for (let index in tokens) {
        let token = tokens[index]
        // console.log(JSON.stringify(token))
        if (token.type === 'html') {
          let fieldName = this.escapeTag(token.token)
          cache[fieldName] = 1
        }
        if (token.type === 'search' && (index - 0) === tokens.length - 2) {
          tokens.splice(tokens.length - 1, 1)
          html = tokens.map(x => x.token).join('')
          this.$refs.expression.innerHTML = html
          this.setFocus(this.$refs.expression)
          this.errorMsg = '请绑定字段'
        }
        if (token.type === 'search' && (index - 0) === tokens.length - 1) {
          this.keyword = token.token
          this.openSelection()
        }
      }
      for (let key in this.vars) {
        if (!cache[key]) {
          delete this.vars[key]
        }
      }
    },
    escapeTag (html) {
      let regex = new RegExp(this.regexp.html)
      return regex.exec(html).filter(group => !group.includes('<') && !group.includes('='))[0]
    },
    splitToken (html) {
      let regexList = []
      for (let key in this.regexp) {
        regexList.push('(' + this.regexp[key] + ')')
      }
      let regex = new RegExp(regexList.join('|'), 'g')
      let list = html.match(regex)
      if (list) {
        return list.map(token => {
          for (let type in this.regexp) {
            if (this.testTokenType(type, token)) {
              return {token: token, type: type}
            }
          }
        })
      } else {
        return []
      }
    },
    testTokenType (type, token) {
      let regexp = new RegExp('^' + this.regexp[type] + '$')
      return regexp.test(token)
    },
    onKeyDown (e) {
      const { key } = e
      if (key === 'Enter' || key === ' ') {
        e.preventDefault()
        return
      }
      if (!this.validKeys.test(key)) {
        e.preventDefault()
      }
    },
    openSelection () {
      const {expression, selection} = this.$refs
      const {top, left, height} = expression.getBoundingClientRect()
      let count = this.filteredFields.length
      let selectionHeight = count * 34 + 15
      selection.setAttribute('style', `left: ${left}px; top: ${top + height}px; height: ${selectionHeight > 300 ? 300 : selectionHeight}px; `)
      document.body.appendChild(selection)
      window.addEventListener('click', this.removeSelection)
      this.showSelection = true
    },
    removeSelection () {
      this.showSelection = false
    },
    setFocus (el) {
      const range = document.createRange()
      const sel = window.getSelection()

      range.selectNodeContents(el)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    },
    onOptionClick (field) {
      console.log('option click')
      const res = `<span contenteditable="false" style="color: coral">${field.name}</span> `
      let html = this.$refs.expression.innerHTML
      let tokens = this.splitToken(html)
      if (tokens[tokens.length - 1].type === 'search') {
        tokens.splice(tokens.length - 1, 1)
      }
      tokens.push({type: 'html', token: res})
      html = tokens.map(x => x.token).join('')
      this.$refs.expression.innerHTML = html
      this.vars[field.name] = field
      this.setFocus(this.$refs.expression)
      this.errorMsg = ''
      this.showSelection = false
    },
    parseExpression (e) {
      let expression = this.$refs.expression.innerText
      let res = {
        expression: expression,
        vars: this.vars
      }
      console.log(this.ruleConfig)
      this.ruleConfig.expression = expression
      this.ruleConfig.vars = this.vars
      this.$emit('change', res)
      this.$emit('input', res)
    },
    initExpression () {
      let tokens = this.splitToken(this.ruleConfig.expression)
      tokens.map(token => {
        if (token.type === 'search' && this.ruleConfig.vars[token.token]) {
          token.token = `<span contenteditable="false" style="color: coral">${token.token}</span>`
          token.type = 'html'
        }
      })
      this.$refs.expression.innerHTML = tokens.map(x => x.token).join('')
      this.vars = this.ruleConfig.vars
    }
  },
  mounted () {
    console.log(this.ruleConfig)
    if (this.ruleConfig.expression) {
      this.initExpression()
    } else {
      this.$set(this.ruleConfig, 'expression', '')
      this.$set(this.ruleConfig, 'vars', {})
    }
  },
  destroyed () {
    window.removeEventListener('click', this.removeSelection)
  }
}
</script>

<style scoped lang="css">
.selection {
  z-index: 2002;
  box-shadow: 0 0 32px #cdd5de6b;
  box-sizing: border-box;
  border: 1px #DDDDDD solid;
  width: 500px;
  margin: 0 0;
  position: absolute;
  transform-origin: center top;
  background: white;
}
.el-select-dropdown__item {
  font-size:14px;
  padding:0 20px;
  position:relative;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  color:#606266;
  height:34px;
  line-height:34px;
  -webkit-box-sizing:border-box;
  box-sizing:border-box;
  cursor:pointer
}
.el-select-dropdown__item:hover {
  background: #f5f7fa;
}
.el-select-dropdown__list {
  list-style:none;
  padding:6px 0;
  margin:0;
  -webkit-box-sizing:border-box;
  box-sizing:border-box;
  height: 100px;
}
.el-scrollbar__wrap {
  overflow: auto;
  height: 100%
}
</style>
