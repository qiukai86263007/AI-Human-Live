import {createApp} from 'vue'
import store from "../store";

import ArcoVue, {Message} from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import '@arco-design/web-vue/dist/arco.css'

import {i18n, t} from "../lang";

import '../style.less'
import {Dialog} from "../lib/dialog";

import {CommonComponents} from "../components/common";
import Page from "./Page.vue";
import PageSetup from "../pages/PageSetup.vue";

const app = createApp(Page, {
    name: 'setup',
    title: '请按照说明完成软件配置',
    page: PageSetup
})
app.use(ArcoVue)
app.use(ArcoVueIcon)
app.use(CommonComponents)
app.use(i18n)
app.use(store)
Message._context = app._context
app.config.globalProperties.$mapi = window.$mapi
app.config.globalProperties.$dialog = Dialog
app.config.globalProperties.$t = t as any
app.mount('#app')
    .$nextTick(() => {
        postMessage({payload: 'removeLoading'}, '*')
    })
