looplan-orm

asdfasdfasdf


# 基础查询

# 菜单

- [测试](./TEST.md)




# 文档配置

本文档用于looplan-doc的配置，通过配置可以实现文档的自定义。

```looplan-doc
{
    "title":"looplan-orm",
    "plugins":[
        {
            "type":"lib",
            "designer":"加载库",
            "options":{
                "name":"lib",
            }
        },
        {
            "type":"toc",
            "designer":"生成文档导航",
            "options":{
                "title":"目录",
                "depth":3
            }
        }
    ],
    "menu":{
        "tabs":false
    },
    "header":{
      "links":[
        {
          "title":"GitHub",
          "url":"https://github.com/loqhcn/looplan-orm"
        }
      ]
    },
    "footer":{
      "content":"Copyright © 2024 looplan",
      "icp":{
        "title":"渝ICP备18017266号-1",
        "url":"https://beian.miit.gov.cn/"
      }
    }
}
```