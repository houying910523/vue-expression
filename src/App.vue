<template>
  <div id="app">
    <vue-expression :fields="fields" :rule-config="ruleConfig" >

    </vue-expression>
  </div>
</template>

<script>
import VueExpression from '@/components/vue-expression'
export default {
  name: 'App',
  components: {VueExpression},
  data () {
    return {
      fields: [
        {name: 'aaa'},
        {name: 'baa'},
        {name: 'caa'},
        {name: 'bbb'},
        {name: 'cbb'},
        {name: 'dbb'},
        {name: 'ebb'},
        {name: 'fbb'},
        {name: 'ebb'},
        {name: 'hbb'},
        {name: 'ibb'},
        {name: 'jbb'},
        {name: 'kbb'}
      ],
      ruleConfig: {
        expression: '',
        vars: {}
      }
    }
  }
}
</script>
