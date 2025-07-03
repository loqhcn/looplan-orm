// node test/curd.js
import {Db} from '../src';

let logs: any[] = [];

logs.push("# 测试curd");

logs.push("## 添加");
logs.push("-- 添加-insert");

let result: any = await Db.table('ct_test1').insert({
    name: 'test',
    age: 18,
    status: 1
});
logs.push(result);

logs.push("-- 添加-insertGetId");
result = await Db.table('ct_test1').insertGetId({
    name: 'test',
    age: 18,
    status: 1
});
logs.push(result);
logs.push("-- 添加-insertAll");
result = await Db.table('ct_test1').insertAll([
        {
            name: 'test-1',
            age: 18,
            status: 1
        },
        {
            name: 'test-2',
            age: 19,
            status: 2
        }
]);
logs.push(result);


logs.push("## 更新");
result = await Db.table('ct_test1').where('id', 1).update({
    name: 'test2',
    age: 19
});

logs.push(result);


logs.push("## 删除");

result = await Db.table('ct_test1').where('id', 3).delete();
logs.push(result);


logs.push("## 查询");
result = await Db.table('ct_test1').where('id', 1).find();
logs.push(result);


logs.push("## 查询-select");
result = await Db.table('ct_test1').select();
logs.push(result);

// 测试 sum,count,max,min

logs.push("## 测试 sum,count,max,min");
logs.push("-- 测试 sum");
result = await Db.table('ct_test1').sum('age');
logs.push(result);

logs.push("-- 测试 count");
result = await Db.table('ct_test1').count('age');
logs.push(result);

logs.push("-- 测试 max");
result = await Db.table('ct_test1').max('age');
logs.push(result);

logs.push("-- 测试 min");
result = await Db.table('ct_test1').min('age');
logs.push(result);

console.log(logs);




/*

# user

CREATE TABLE `ct_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nickname` varchar(255) COLLATE utf8_unicode_ci DEFAULT '用户昵称',
  `status` int(4) DEFAULT NULL COMMENT '状态存储',
  `money` decimal(11,2) DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
  `password` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
  `username` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
  `createtime` int(11) DEFAULT NULL,
  `updatetime` int(11) DEFAULT NULL,
  `deletetime` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

# test1

CREATE TABLE `ct_test1` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
  `age` int(11) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `status` int(4) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `money` decimal(11,2) DEFAULT '10.00',
  `pay_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT '',
  `pay_time` int(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

*/