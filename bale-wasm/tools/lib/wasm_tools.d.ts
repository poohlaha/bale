/* tslint:disable */
/* eslint-disable */
/**
*
*  发送普通请求, 包括 `form` 表单提交
* @param {any} opts
* @param {boolean | undefined} [is_form_submit]
* @returns {Promise<any>}
*/
export function send(opts: any, is_form_submit?: boolean): Promise<any>;
/**
*
*  发送 `FormData` 请求, 包括文件上传
* 
* @param {any} opts
* @returns {Promise<any>}
*/
export function send_form_data(opts: any): Promise<any>;
