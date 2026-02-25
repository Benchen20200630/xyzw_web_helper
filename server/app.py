import requests
import re
import os
import json
import base64
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def extract_target_chars(text):
    # 保留字母(a-zA-Z)、数字(0-9)及特定符号(+=?/)
    pattern = r'[^a-zA-Z0-9+=?/]'
    return re.sub(pattern, '', text)

ALLOWED_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bin')  # 限制文件读取目录
if not os.path.exists(ALLOWED_DIR):
    os.makedirs(ALLOWED_DIR)

def safe_path(bin_param):
    # 过滤危险字符，拼接安全路径
    filename = f"{bin_param}.bin"
    safe_filename = os.path.basename(filename)  # 防止路径遍历
    return os.path.join(ALLOWED_DIR, safe_filename)
    
def extract_token_content(result_str):
    # 查找'token'的位置（注意大小写）
    token_start = result_str.find('Token')
    if token_start == -1:
        return "未找到'Token'关键词"
   
    # 查找'roleId'的位置（注意大小写）
    roleid_start = result_str.find('roleId')
    if roleid_start == -1:
        return "未找到'roleId'关键词"
   
    # 计算token结束位置（跳过'token'本身）
    token_end = token_start + len('Token')
   
    # 提取token到roleId之间的内容
    if token_end >= roleid_start:
        return "token和roleId位置重叠或顺序不正确"
    extracted_content = result_str[token_end:roleid_start]
    return extracted_content

def encode_to_base64(input_string):
    # 将字符串转换为bytes
    input_bytes = input_string.encode('utf-8')
    
    # 进行Base64编码
    encoded_bytes = base64.b64encode(input_bytes)
    
    # 将编码后的bytes转换回字符串
    encoded_string = encoded_bytes.decode('utf-8')
    return encoded_string

def decode_from_base64(encoded_string):
    encoded_bytes = encoded_string.encode('utf-8')
    decoded_bytes = base64.b64decode(encoded_bytes)
    decoded_string = decoded_bytes.decode('utf-8')
    return decoded_string


@app.route('/<string:bin_param>/<string:key>')
def home(bin_param,key):
    if key != encode_to_base64(bin_param):
        return ""
    url = "https://xxz-xyzw.hortorgames.com/login/authuser?_seq=1"
    try:
        with open(safe_path(bin_param), 'rb') as f:
           payload = f.read()
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404
    except PermissionError:
        return jsonify({"error": "Permission denied"}), 403

    headers = {
   'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.1.2; SM-G9810 Build/QP1A.190711.020)',
   'Host': 'xxz-xyzw.hortorgames.com',
   'Content-Type': 'application/octet-stream'
    }

    response = requests.request("POST", url, headers=headers, data=payload)
    result = extract_target_chars(response.text)
    roletoken = extract_token_content(result)
    json_data = {"roleToken": roletoken}
    json_result = json.dumps(json_data, indent=2)
    base64str = encode_to_base64(json_result)
    json_data1 = {"token": base64str}
    json_result1 = json.dumps(json_data1, indent=2)
    return json_result1

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
