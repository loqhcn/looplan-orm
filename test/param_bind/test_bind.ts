import { Db } from '../../src';

let logs: any[] = [];

const row = await Db.table("ct_cloud_components")
    .where("name", null)
    .find();


logs.push("# 测试参数绑定");
logs.push(row);

// 版本信息
let components: any = await Db.table("ct_cloud_components_item")
    .where("componentId", row.id)
    .where("id", [1,2])
    .select();

logs.push(components);

logs.forEach(item => {
    console.log(item);
})
