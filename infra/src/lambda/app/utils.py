import boto3

def get_parameter(name, decrypt=False):
    """
    Get parameter value from Parameter Store
    
    Args:
        name (str): Parameter name (e.g., '/app/database/host')
        decrypt (bool): Set True for SecureString parameters
        
    Returns:
        str: Parameter value or None if error
    """
    try:
        ssm = boto3.client('ssm')
        
        response = ssm.get_parameter(
            Name=name,
            WithDecryption=decrypt
        )
        
        return response['Parameter']['Value']
        
    except Exception as e:
        print(f"Error getting parameter {name}: {e}")
        return None